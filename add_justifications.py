#!/usr/bin/env python3
"""
Add Justifications to AI Insights
This script takes the existing detailed_info.json and adds justification sentences
for each insight tag, explaining why that insight was assigned based on the 
customer's emails and reviews.
"""

import json
import os
import time
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_justification_prompt(customer_data, insight_type, insight_value):
    """Create a prompt to generate justification for a specific insight."""
    
    # Gather context from customer data
    reviews_context = ""
    if customer_data.get("reviews"):
        reviews_context = "Customer Reviews:\n"
        for review in customer_data["reviews"]:
            reviews_context += f"- {review['restaurant_name']} ({review['rating']}/5): {review['content']}\n"
    
    emails_context = ""
    if customer_data.get("emails"):
        emails_context = "Customer Emails:\n"
        for email in customer_data["emails"]:
            emails_context += f"- Subject: {email['subject']}\n  Content: {email['combined_thread']}\n"
    
    prompt = f"""Based on the following customer information, provide a brief one-sentence justification for why this insight was assigned:

{reviews_context}

{emails_context}

Insight Type: {insight_type}
Insight Value: {insight_value}

Provide a concise, factual sentence explaining what specific evidence from their reviews or emails led to this insight. Keep it under 25 words and focus on the most relevant evidence.

Justification:"""
    
    return prompt

def add_justifications_to_insights(customer_data, client):
    """Add justifications to all insights for a customer."""
    
    # Check if customer has reservations with insights
    if not customer_data.get("reservations"):
        return customer_data
    
    for reservation in customer_data["reservations"]:
        if "notes" not in reservation or "customer_insights" not in reservation["notes"]:
            continue
            
        insights = reservation["notes"]["customer_insights"]
        
        # Process each insight type
        insight_types = [
            ("customer_values", "customer_values"),
            ("is_new_customer", "is_new_customer"), 
            ("special_accommodations", "special_accommodations"),
            ("staff_interaction_preferences", "staff_interaction_preferences"),
            ("taste_preferences", "taste_preferences"),
            ("personal_interests", "personal_interests")
        ]
        
        for insight_key, insight_name in insight_types:
            if insight_key in insights and insights[insight_key]:
                
                if insight_key == "is_new_customer":
                    # Handle boolean insight
                    insight_value = "New Customer" if insights[insight_key] else "Returning Customer"
                    prompt = create_justification_prompt(customer_data, insight_name, insight_value)
                    
                    try:
                        response = client.chat.completions.create(
                            model="gpt-4o-mini-2024-07-18",
                            messages=[{"role": "user", "content": prompt}],
                            temperature=0.1,
                            max_tokens=50
                        )
                        justification = response.choices[0].message.content.strip()
                        insights[f"{insight_key}_justification"] = justification
                        time.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        print(f"Error generating justification for {insight_key}: {e}")
                        insights[f"{insight_key}_justification"] = "Based on customer communication patterns and history."
                
                elif isinstance(insights[insight_key], list):
                    # Handle list insights (tags)
                    justifications = {}
                    for value in insights[insight_key]:
                        prompt = create_justification_prompt(customer_data, insight_name, value)
                        
                        try:
                            response = client.chat.completions.create(
                                model="gpt-4o-mini-2024-07-18",
                                messages=[{"role": "user", "content": prompt}],
                                temperature=0.1,
                                max_tokens=50
                            )
                            justification = response.choices[0].message.content.strip()
                            justifications[value] = justification
                            time.sleep(0.5)  # Rate limiting
                            
                        except Exception as e:
                            print(f"Error generating justification for {insight_key} - {value}: {e}")
                            justifications[value] = f"Based on customer feedback about {value.lower()}."
                    
                    insights[f"{insight_key}_justifications"] = justifications
                
                else:
                    # Handle string insights
                    prompt = create_justification_prompt(customer_data, insight_name, insights[insight_key])
                    
                    try:
                        response = client.chat.completions.create(
                            model="gpt-4o-mini-2024-07-18",
                            messages=[{"role": "user", "content": prompt}],
                            temperature=0.1,
                            max_tokens=50
                        )
                        justification = response.choices[0].message.content.strip()
                        insights[f"{insight_key}_justification"] = justification
                        time.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        print(f"Error generating justification for {insight_key}: {e}")
                        insights[f"{insight_key}_justification"] = "Based on customer communication and preferences."
    
    return customer_data

def main():
    """Main function to add justifications to the dataset."""
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please create a .env file with your OpenAI API key.")
        return
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Load existing detailed info
    try:
        with open("src/detailed_info.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: src/detailed_info.json not found. Please run generate_insights.py first.")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in src/detailed_info.json: {e}")
        return
    
    print(f"Adding justifications for {len(data['diners'])} customers...")
    
    # Process each customer
    for i, customer in enumerate(data["diners"]):
        print(f"Processing {customer['name']} ({i+1}/{len(data['diners'])})")
        
        # Add justifications to insights
        data["diners"][i] = add_justifications_to_insights(customer, client)
    
    # Save updated data
    try:
        with open("src/detailed_info.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✓ Successfully added justifications to src/detailed_info.json")
        
    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    main() 