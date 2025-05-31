# Restaurant Chef Dashboard & Data Processing System

A comprehensive restaurant management system that combines AI-powered customer data analysis with an intuitive chef dashboard interface. This project helps restaurant staff understand customer preferences, manage special accommodations, and prioritize kitchen operations based on guest needs.

## 🎯 Project Overview

This system consists of two main components:

1. **Python Data Processing Engine**: Uses OpenAI's GPT models to analyze customer reviews and emails, extracting insights about preferences, special accommodations, and dining patterns
2. **React Chef Dashboard**: An interactive web interface that helps kitchen staff manage reservations, track special dietary requirements, and prioritize table service based on customer needs

## ✨ Key Features

### 📊 AI-Powered Customer Analysis
- **Customer Values Detection**: Identifies what customers value most (service quality, ambiance, etc.)
- **Special Accommodations Tracking**: Wheelchair access, birthday celebrations, allergies, etc.
- **Dietary Restrictions Management**: Comprehensive tracking of gluten-free, nut-free, shellfish-free requirements
- **Taste Profile Analysis**: Preference detection for sweet, spicy, savory, rich, or light flavors
- **Staff Interaction Preferences**: Understanding how customers prefer to interact with staff

### 🍽️ Chef Dashboard Interface
- **Multiple View Modes**:
  - **Different Days View**: Overview of reservations across different dates
  - **Same Day View**: Detailed view of today's reservations with priority sorting
  - **Chef View**: Kitchen-focused interface with Tables and Dishes modes

- **Smart Prioritization**: Automatically sorts reservations by complexity (special needs first)
- **Search & Filter**: Quick search by table number, customer name, or dish
- **Table Management**: Add/remove tables with real-time updates
- **Dish Organization**: View dishes by popularity and which tables ordered them

### 🔍 Advanced Dashboard Features
- **Real-time Search**: Filter reservations by table, customer, or menu items
- **Priority Sorting**: Tables with special accommodations appear first
- **Dietary Exception Tracking**: Clear visibility of all dietary restrictions
- **Table Deletion**: Remove completed tables from active view
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sagarvarma1/dining.git
   cd dining
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install React dependencies**
   ```bash
   npm install
   ```

4. **Set up OpenAI API key**
   ```bash
   export OPENAI_API_KEY='your-openai-api-key-here'
   ```

### Usage

#### Step 1: Process Customer Data
```bash
# Test the processing (recommended first)
python test_script.py

# Process the full dataset
python generate_insights.py

# Extract dishes for chef dashboard
python extract_dishes.py
```

#### Step 2: Launch the Dashboard
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

## 📁 Project Structure

```
restaurant-chef-dashboard/
├── src/                          # React frontend source
│   ├── App.js                   # Main dashboard component
│   ├── App.css                  # Dashboard styling
│   ├── index.js                 # React entry point
│   ├── index.css                # Global styles
│   └── fine-dining-dataset.json # Sample customer data
├── public/                       # Public assets
├── extract_dishes.py           # Dish extraction script
├── generate_insights.py        # Customer analysis script
├── add_justifications.py       # Data enhancement script
├── test_script.py             # Testing utilities
├── requirements.txt           # Python dependencies
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## 🎨 Dashboard Views

### Same Day View
- **Priority-based sorting**: Tables with special accommodations appear first
- **Customer insights**: View dietary restrictions and preferences at a glance
- **Table management**: Easy addition and removal of completed orders

### Chef View - Tables Mode
- **Table-centric organization**: See all dishes and exceptions per table
- **Special accommodations**: Wheelchair access, allergies, celebrations highlighted
- **Search functionality**: Quick filtering by table number or customer name

### Chef View - Dishes Mode
- **Dish popularity tracking**: See which items are ordered most
- **Table assignments**: Know which tables ordered specific dishes
- **Dietary variations**: Track gluten-free, nut-free modifications per dish

## 🤖 AI Analysis Features

The system uses OpenAI's GPT models to analyze customer data with a **conservative approach**:

### Customer Insights Generated:
- **Customer Values**: Service quality, ambiance preferences, conversation importance
- **New vs. Returning**: Customer classification based on email patterns
- **Special Accommodations**: Birthday celebrations, accessibility needs, seating preferences
- **Taste Preferences**: Sweet, spicy, savory, rich, or light flavor profiles
- **Staff Interaction**: Preferred communication styles (chatty, professional, knowledgeable)
- **Personal Interests**: Art, wine, sports, travel, music, local culture

### Data Processing:
- **Conservative Analysis**: Only confident insights are included
- **Rate Limiting**: Respects OpenAI API limits with built-in delays
- **Error Handling**: Robust fallback for API failures
- **Cost Optimization**: Uses efficient model (gpt-4.1-mini) for budget-friendly processing

## 💰 Cost Considerations

- **OpenAI API costs**: ~$0.005-0.01 per customer analysis
- **Sample dataset (50 customers)**: ~$0.25-0.50 total cost
- **Production use**: Scales linearly with customer volume

## 🛠️ Development

### Running in Development Mode
```bash
# Start React development server
npm start

# Run Python scripts for data processing
python generate_insights.py
```

### Building for Production
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT models for customer analysis
- React team for the excellent frontend framework
- The restaurant industry for inspiring this solution

## 🆘 Troubleshooting

**Dashboard not loading?**
- Ensure `npm install` completed successfully
- Check that `src/fine-dining-dataset.json` exists
- Verify Node.js version (v14+)

**AI analysis not working?**
- Confirm OpenAI API key is set correctly
- Check internet connection for API calls
- Verify `requirements.txt` packages are installed

**Missing dishes in chef view?**
- Run `python extract_dishes.py` to generate dish data
- Ensure the script completed without errors
- Check that `dishes.json` was created

For more specific issues, please check the console logs or create an issue on GitHub. 