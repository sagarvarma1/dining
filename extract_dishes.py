#!/usr/bin/env python3
"""
Extract Dishes Information from Detailed Info
This script takes the detailed_info.json file and creates a dishes.json file
that contains table information, cost, group size, and all dishes with
exceptions, organized by party.
"""

import json
import os
import time
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

def create_table_assignment_prompt(customer_name, group_size, special_accommodations, date):
    """Create a prompt to generate table assignment based on party requirements."""
    
    prompt = f"""You are a restaurant host assigning tables for fine dining restaurant "French Laudure". 

Customer: {customer_name}
Party Size: {group_size}
Date: {date}
Special Accommodations: {special_accommodations if special_accommodations else "None"}

Based on this information, assign an appropriate table number (1-20) considering:
- Party size (tables 1-5 for 2 people, 6-12 for 3-4 people, 13-18 for 5-6 people, 19-20 for 7+ people)
- Special needs (wheelchair access: tables 3,7,11,15; quiet/private: tables 1,8,14,20; piano area: tables 5,12)
- VIP/private dining: tables 19,20

Respond with only the table number (just the number, no extra text):"""
    
    return prompt

def extract_dishes_info(data, client):
    """Extract dishes information organized by party."""
    
    dishes_data = {"parties": []}
    party_id = 1
    
    for customer in data.get("diners", []):
        customer_name = customer.get("name", "Unknown")
        
        for reservation in customer.get("reservations", []):
            print(f"Processing party {party_id}: {customer_name}")
            
            # Extract basic info
            date = reservation.get("date", "")
            group_size = reservation.get("number_of_people", 0)
            orders = reservation.get("orders", [])
            
            # Calculate total cost
            total_cost = sum(order.get("price", 0) for order in orders)
            
            # Extract special accommodations from insights
            special_accommodations = []
            if "notes" in reservation and "customer_insights" in reservation["notes"]:
                insights = reservation["notes"]["customer_insights"]
                special_accommodations = insights.get("special_accommodations", [])
            
            # Generate table assignment using LLM
            table_prompt = create_table_assignment_prompt(
                customer_name, group_size, special_accommodations, date
            )
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4.1-mini-2025-04-14",
                    messages=[{"role": "user", "content": table_prompt}],
                    temperature=0.1,
                    max_tokens=10
                )
                table_number = int(response.choices[0].message.content.strip())
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error generating table assignment for {customer_name}: {e}")
                # Fallback table assignment based on group size
                if group_size <= 2:
                    table_number = 3
                elif group_size <= 4:
                    table_number = 8
                elif group_size <= 6:
                    table_number = 15
                else:
                    table_number = 19
            
            # Extract dishes with exceptions
            dishes = []
            for order in orders:
                dish = {
                    "name": order.get("item", ""),
                    "price": order.get("price", 0),
                    "dietary_exceptions": order.get("dietary_tags", [])
                }
                dishes.append(dish)
            
            # Create party entry
            party = {
                "party_id": party_id,
                "customer_name": customer_name,
                "date": date,
                "table_number": table_number,
                "group_size": group_size,
                "total_cost": round(total_cost, 2),
                "special_accommodations": special_accommodations,
                "dishes": dishes
            }
            
            dishes_data["parties"].append(party)
            party_id += 1
    
    return dishes_data

def main():
    """Main function to extract dishes information."""
    
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please create a .env file with your OpenAI API key.")
        return
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Load detailed info
    try:
        with open("src/detailed_info.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: src/detailed_info.json not found. Please run generate_insights.py first.")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in src/detailed_info.json: {e}")
        return
    
    print(f"Extracting dishes information for {len(data['diners'])} customers...")
    
    # Extract dishes information
    dishes_data = extract_dishes_info(data, client)
    
    # Add metadata
    dishes_data["metadata"] = {
        "generated_at": datetime.now().isoformat(),
        "total_parties": len(dishes_data["parties"]),
        "total_revenue": sum(party["total_cost"] for party in dishes_data["parties"]),
        "source_file": "src/detailed_info.json"
    }
    
    # Save dishes data
    try:
        with open("dishes.json", "w", encoding="utf-8") as f:
            json.dump(dishes_data, f, indent=2, ensure_ascii=False)
        print(f"✓ Successfully created dishes.json with {len(dishes_data['parties'])} parties")
        print(f"✓ Total revenue: ${dishes_data['metadata']['total_revenue']:.2f}")
        
    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    main() 