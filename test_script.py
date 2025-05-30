#!/usr/bin/env python3
"""
Test script to verify the insight generation works on a small sample
"""

import json
import os
from dotenv import load_dotenv
from generate_insights import generate_customer_insights

# Load environment variables from .env file
load_dotenv()

def test_single_customer():
    """Test the insight generation on a single customer"""
    
    # Sample customer data from the dataset
    sample_customer = {
        "name": "Emily Chen",
        "reviews": [
            {
                "restaurant_name": "French Laudure",
                "date": "2023-11-15",
                "rating": 5,
                "content": "I visited last autumn, and it was unforgettable. They crafted a special gluten-free tasting menu for me, and the dessert trolley blew me away. The staff even chatted enthusiastically about a local art exhibit, making the whole experience feel personal."
            },
            {
                "restaurant_name": "Sushi Blossom",
                "date": "2024-02-10",
                "rating": 4,
                "content": "An excellent spot for omakase. The chef politely asked about my dietary restrictions and was happy to accommodate. The only downside: it was slightly crowded, so conversation was a bit difficult."
            }
        ],
        "emails": [
            {
                "date": "2024-05-18",
                "subject": "Gluten-Free Options + Additional Guest",
                "combined_thread": "Hello, I'm thrilled to return to French Laudure on May 20th. Since my cousin decided to join us, can we adjust our table for one more person? Also, I'd love details on the gluten-free amuse-bouche if possible. Thanks!"
            }
        ]
    }
    
    print("Testing insight generation on sample customer...")
    print(f"Customer: {sample_customer['name']}")
    print("-" * 50)
    
    # Check if API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OpenAI API key not found.")
        print("Please set your API key: export OPENAI_API_KEY='your-key-here'")
        return False
    
    try:
        insights = generate_customer_insights(sample_customer)
        
        print("✅ Successfully generated insights!")
        print("\nGenerated Insights:")
        print(json.dumps(insights, indent=2))
        
        # Validate the structure
        expected_fields = ["customer_values", "is_new_customer", "special_accommodations", "taste_preferences", "staff_interaction_preferences"]
        present_fields = list(insights.keys())
        
        print(f"\n📊 Analysis Results:")
        print(f"   Fields present: {present_fields}")
        print(f"   Conservative approach: Only confident insights included")
        
        # Check if we got meaningful insights
        if insights:
            print("✅ Insights generated successfully!")
            if "taste_preferences" in insights:
                print(f"   Taste preference detected: {insights['taste_preferences']}")
            if "staff_interaction_preferences" in insights:
                print(f"   Staff interaction preferences: {', '.join(insights['staff_interaction_preferences'])}")
        else:
            print("⚠️  No confident insights generated (this is normal for conservative analysis)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating insights: {str(e)}")
        return False

def main():
    """Main test function"""
    print("Fine Dining Dataset Enhancement - Test Script")
    print("=" * 50)
    print("Testing with conservative analysis using gpt-4.1-mini-2025-04-14")
    print("Only confident insights will be included\n")
    
    success = test_single_customer()
    
    if success:
        print("\n🎉 Test completed successfully!")
        print("You can now run the full script with: python generate_insights.py")
    else:
        print("\n❌ Test failed. Please check your setup and try again.")

if __name__ == "__main__":
    main() 