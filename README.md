# WanderVault 🌍

WanderVault is a travel planning and budgeting web app built with the MERN stack. It helps users organize trips, track expenses, plan daily itineraries, and discover nearby places — all in one place.

## Features ✨
- **Trip Creation Wizard:** Step-by-step form to plan trips with destination search, travel mode, dates, and accommodation.
- **Budget Tracking:** Real-time expense tracking with pie charts, bar charts, and budget alerts.
- **Daily Itinerary:** Plan day-by-day activities with time, location, and notes.
- **Nearby Places:** Search for dining, sightseeing, and hotels near your destination using live map data.
- **Data Export:** Export trip budgets and expenses as PDF or CSV files.
- **Social Sharing:** Share public trip links or send itineraries via WhatsApp.

## Tech Stack 🛠️
- **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **External APIs:** OpenStreetMap / Overpass API (for location, dining, and sightseeing data)

## Setup Steps 🚀

### 1. Clone the repository
```bash
git clone https://github.com/sahilparab0405/WanderVault.git
cd WanderVault
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file based on `.env.example`.
- Start the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
- Start the development server:
```bash
npm run dev
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
