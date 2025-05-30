# Fine Dining Dataset Enhancement Script

This script analyzes customer data from a fine dining restaurant dataset and generates AI-powered insights for each reservation using OpenAI's gpt-4.1-mini-2025-04-14 model.

## Features

The script generates **conservative insights** including:
- **Customer Values**: What customers value based on their reviews (e.g., "conversation", "personalized service", "authentic experience")
- **New vs. Returning Customer**: Analysis based on email tone and references to "returning"
- **Special Accommodations**: Birthday celebrations, wheelchair access, quiet tables, etc.
- **Taste Preferences**: Specific taste profile - "sweet", "spicy", "savory", "rich", or "light" (only if clearly evident)
- **Staff Interaction Preferences**: What customers like about staff - "chatty", "professional", "knowledgeable", "friendly", "enthusiastic", "attentive"
- **Personal Interests**: Things customers mention enjoying - "art", "science", "desserts", "wine", "sports", "travel", "music", "local culture", etc.

**Important**: This script uses a **conservative approach** - it only includes insights when there is clear evidence in the customer data. Empty fields mean the data wasn't conclusive enough to make a confident determination.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set OpenAI API Key

You need an OpenAI API key to run this script. Set it as an environment variable:

**Linux/Mac:**
```bash
export OPENAI_API_KEY='your-openai-api-key-here'
```

**Windows:**
```cmd
set OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Ensure Data File is Present

Make sure `src/fine-dining-dataset.json` exists in your project directory.

## Usage

**Test first (recommended):**
```bash
python test_script.py
```

**Run the full processing:**
```bash
python generate_insights.py
```

The script will:
1. Read the original dataset from `src/fine-dining-dataset.json`
2. Process each customer's reviews and emails with conservative analysis
3. Generate AI insights for each reservation (only confident insights)
4. Save the enhanced data to `detailed_info.json`

## Output Format

Each reservation in the output file will have a new `notes` field. **Only confident insights are included**:

```json
{
  "date": "2024-05-20",
  "number_of_people": 4,
  "orders": [...],
  "notes": {
    "customer_insights": {
      "customer_values": ["personalized service", "conversation"],
      "is_new_customer": false,
      "special_accommodations": ["birthday celebration"],
      "taste_preferences": "sweet",
      "staff_interaction_preferences": ["chatty", "knowledgeable"],
      "personal_interests": ["art", "wine", "local culture"]
    },
    "generated_at": "2024-01-15T10:30:00.000000",
    "summary": "Values: personalized service, conversation. Returning customer. Special needs: birthday celebration. Taste preference: sweet. Likes staff who are: chatty, knowledgeable. Personal interests: art, wine, local culture."
  }
}
```

**Note**: If no confident insights can be determined, fields will be omitted entirely. This is normal and expected with the conservative approach.

## Conservative Analysis Approach

- **Taste Preferences**: Only returns specific values ("sweet", "spicy", "savory", "rich", "light") when clearly evident from reviews
- **Staff Preferences**: Only includes when customers explicitly mention positive staff interactions
- **Customer Values**: Only includes when clearly stated in reviews
- **Special Accommodations**: Only when explicitly mentioned in emails or reviews
- **Personal Interests**: Only includes interests explicitly mentioned in reviews (e.g., art exhibits, wine knowledge, sports teams, local attractions)

## Processing Time

The script includes rate limiting delays to respect OpenAI's API limits. Processing time depends on:
- Number of customers in the dataset
- API response times
- Rate limiting delays (0.5 seconds between requests)

For the sample dataset with ~50 customers, expect 2-5 minutes of processing time.

## Error Handling

The script includes robust error handling:
- Returns empty insights if API calls fail
- JSON parsing error recovery
- File reading/writing error handling
- Rate limiting respect

## Cost Considerations

This script uses OpenAI's gpt-4.1-mini-2025-04-14 model, which incurs API costs. Each customer analysis costs approximately $0.005-0.01 USD. For a dataset of 50 customers, expect costs of ~$0.25-0.50 USD.

## Troubleshooting

**"OpenAI API key not found"**
- Ensure you've set the OPENAI_API_KEY environment variable
- Restart your terminal/command prompt after setting the variable

**"fine-dining-dataset.json not found"**
- Ensure the file exists in the `src/` directory
- Check the file path and permissions

**"No insights generated"**
- This is normal with conservative analysis - it means the data wasn't conclusive enough
- The AI only provides insights when it's confident based on clear evidence

**API Rate Limiting Errors**
- The script includes automatic delays, but if you encounter issues, you can increase the `time.sleep()` values in the code 