import json
from openai import OpenAI
from typing import Dict, List, Any
import os
from datetime import datetime
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_customer_insights(diner_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate insights for a customer based on their reviews and emails using OpenAI API
    """
    
    # Prepare the context for the LLM
    customer_name = diner_data.get("name", "Unknown")
    reviews = diner_data.get("reviews", [])
    emails = diner_data.get("emails", [])
    
    # Build context string
    context = f"Customer: {customer_name}\n\n"
    
    if reviews:
        context += "PREVIOUS REVIEWS:\n"
        for review in reviews:
            context += f"- {review.get('restaurant_name', '')}: {review.get('content', '')} (Rating: {review.get('rating', 'N/A')})\n"
        context += "\n"
    
    if emails:
        context += "RECENT EMAILS:\n"
        for email in emails:
            context += f"- Subject: {email.get('subject', '')}\n  Content: {email.get('combined_thread', '')}\n"
        context += "\n"
    
    prompt = f"""Based on the customer data below, provide insights in the following JSON format. ONLY include a field if you are confident based on clear evidence in the data. If you cannot determine something with confidence, leave that array empty or set to null.

{{
    "customer_values": ["value1", "value2"],
    "is_new_customer": true/false,
    "special_accommodations": ["accommodation1", "accommodation2"],
    "taste_preferences": "sweet/spicy/savory/rich/light/null",
    "staff_interaction_preferences": ["chatty", "professional", "knowledgeable", "friendly"],
    "personal_interests": ["interest1", "interest2", "interest3"]
}}

Guidelines:
- customer_values: Extract 2-3 action words/phrases from reviews showing what they value (e.g., "conversation", "not too crowded", "personalized service", "authentic experience", "quick service"). Only include if clearly stated.
- is_new_customer: Determine if this is a new customer based on email tone, references to "returning", "back to", etc. Only set if clear evidence.
- special_accommodations: Any special needs like wheelchair access, birthday celebrations, quiet tables, etc. Only if explicitly mentioned.
- taste_preferences: Determine if they prefer "sweet", "spicy", "savory", "rich", or "light" foods based on what they enjoyed in reviews. Use "null" if unclear.
- staff_interaction_preferences: What they like about staff interactions based on positive mentions - "chatty", "professional", "knowledgeable", "friendly", "enthusiastic", "attentive". Only include if clearly mentioned in reviews.
- personal_interests: Things they mention enjoying or being interested in from their reviews - "art", "science", "desserts", "wine", "sports", "travel", "music", "local culture", "history", etc. Only include if explicitly mentioned.

Customer Data:
{context}

Respond only with valid JSON. Be conservative - only include insights you are confident about based on clear evidence:"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini-2025-04-14",
            messages=[
                {"role": "system", "content": "You are a restaurant data analyst. Analyze customer data and provide insights in JSON format only. Be conservative and only include insights you are confident about based on clear evidence in the data."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.1
        )
        
        insights_text = response.choices[0].message.content.strip()
        
        # Try to parse the JSON response
        try:
            insights = json.loads(insights_text)
            
            # Clean up null values and empty arrays
            cleaned_insights = {}
            for key, value in insights.items():
                if key == "taste_preferences":
                    if value and value != "null":
                        cleaned_insights[key] = value
                elif isinstance(value, list) and value:
                    cleaned_insights[key] = value
                elif isinstance(value, bool):
                    cleaned_insights[key] = value
                elif value and not isinstance(value, list):
                    cleaned_insights[key] = value
            
            return cleaned_insights
        except json.JSONDecodeError:
            # If JSON parsing fails, return empty insights
            print(f"Warning: Could not parse JSON for {customer_name}. Returning empty insights.")
            return {}
            
    except Exception as e:
        print(f"Error generating insights for {customer_name}: {str(e)}")
        # Add a small delay to avoid rate limiting
        time.sleep(1)
        return {}

def process_reservations():
    """
    Process the fine dining dataset and add insights to each reservation
    """
    
    # Read the original data
    try:
        with open('src/fine-dining-dataset.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        print("Error: fine-dining-dataset.json not found in src/ directory")
        return
    except json.JSONDecodeError:
        print("Error: Invalid JSON in fine-dining-dataset.json")
        return
    
    enhanced_data = {"diners": []}
    
    total_diners = len(data.get("diners", []))
    
    for idx, diner in enumerate(data.get("diners", []), 1):
        print(f"Processing diner {idx}/{total_diners}: {diner.get('name', 'Unknown')}")
        
        # Generate insights for this customer
        customer_insights = generate_customer_insights(diner)
        
        # Add a small delay to respect API rate limits
        time.sleep(0.5)
        
        # Create enhanced diner data
        enhanced_diner = {
            "name": diner.get("name"),
            "reviews": diner.get("reviews", []),
            "reservations": [],
            "emails": diner.get("emails", [])
        }
        
        # Add insights to each reservation
        for reservation in diner.get("reservations", []):
            # Build summary from insights
            summary_parts = []
            
            if customer_insights.get("customer_values"):
                summary_parts.append(f"Values: {', '.join(customer_insights['customer_values'])}")
            
            if "is_new_customer" in customer_insights:
                summary_parts.append("New customer" if customer_insights["is_new_customer"] else "Returning customer")
            
            if customer_insights.get("special_accommodations"):
                summary_parts.append(f"Special needs: {', '.join(customer_insights['special_accommodations'])}")
            
            if customer_insights.get("taste_preferences"):
                summary_parts.append(f"Taste preference: {customer_insights['taste_preferences']}")
            
            if customer_insights.get("staff_interaction_preferences"):
                summary_parts.append(f"Likes staff who are: {', '.join(customer_insights['staff_interaction_preferences'])}")
            
            if customer_insights.get("personal_interests"):
                summary_parts.append(f"Personal interests: {', '.join(customer_insights['personal_interests'])}")
            
            summary = ". ".join(summary_parts) if summary_parts else "No specific insights available"
            
            enhanced_reservation = {
                "date": reservation.get("date"),
                "number_of_people": reservation.get("number_of_people"),
                "orders": reservation.get("orders", []),
                "notes": {
                    "customer_insights": customer_insights,
                    "generated_at": datetime.now().isoformat(),
                    "summary": summary
                }
            }
            enhanced_diner["reservations"].append(enhanced_reservation)
        
        enhanced_data["diners"].append(enhanced_diner)
    
    # Save the enhanced data
    try:
        with open('detailed_info.json', 'w', encoding='utf-8') as file:
            json.dump(enhanced_data, file, indent=2, ensure_ascii=False)
        print(f"\nEnhanced data saved to 'detailed_info.json'")
        print(f"Processed {total_diners} diners with their reservations")
    except Exception as e:
        print(f"Error saving enhanced data: {str(e)}")

def main():
    """
    Main function to run the insight generation process
    """
    print("Fine Dining Dataset Enhancement Script")
    print("=====================================")
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OpenAI API key not found.")
        print("Please set your API key as an environment variable:")
        print("export OPENAI_API_KEY='your-key-here'")
        return
    
    print("Starting to process reservations and generate insights...")
    print("This may take a few minutes due to API rate limiting...")
    print("Using conservative analysis - only confident insights will be included...")
    process_reservations()
    print("Process completed!")

if __name__ == "__main__":
    main() 