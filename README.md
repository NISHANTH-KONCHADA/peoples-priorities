<div align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Hackathon-Ready-blue?style=for-the-badge" alt="Hackathon" />
  <img src="https://img.shields.io/badge/Powered_by-Groq_&_Llama_3-orange?style=for-the-badge" alt="Groq" />

  <h1>🏛️ People's Priorities</h1>
  <p><strong>A Next-Generation Civic Intelligence Dashboard for Elected Representatives</strong></p>
  
  <p>
    <a href="https://peoplespriorities.web.app"><b>🌐 View Live Demo</b></a>
  </p>
</div>

<br />

> **People's Priorities** is an intelligent, multi-lingual civic engagement platform designed to bridge the gap between grassroots citizen demands and top-down government project proposals. By leveraging Large Language Models (LLMs), it analyzes thousands of citizen complaints, identifies underlying themes, and dynamically ranks civic projects based on real human urgency.

---

## ✨ Standout Features

### 🧠 Semantic NLP & Multi-Lingual Support
- Citizens can submit complaints in **English, Hindi, and Tamil**.
- The backend automatically translates submissions, corrects grammar, and extracts **core themes** and **urgency scores (1-5)** using Llama 3 via the Groq API.
- **Smart Clustering:** The Live Feed doesn't look like a spam wall. The AI groups semantically identical complaints in the same ward, displaying them with a clean `+39 similar reports` badge.

### ⚖️ Priority Ranking Engine & "Clash Detection"
- The system evaluates government proposed projects (e.g., "Ward 15 Tech Park") against *actual* citizen demand data.
- **Clash Callout:** If the government proposes a vanity project in a ward where citizens are overwhelmingly begging for primary schools, the UI dynamically throws a highly visible **⚠️ Clash Detected** alert to warn the representative of the mismatch.

### 💰 Constituency Budget Simulator
- Elected officials can input their total allocated budget (e.g., ₹5,00,00,000). 
- The system cascades down the dynamically ranked priority list, automatically highlighting which projects are **Funded** and which fall below the line and are **Deferred**.

### 📈 AI Executive Digest & Trend Timeline
- **Executive Digest:** On dashboard load, the AI generates a professional, single-paragraph briefing comparing the last 7 days of complaints to the previous month (e.g., *"Complaint volume surged recently, driven by 40 new reports of Drainage Overflows in Ward 9"*).
- **Trend Analysis:** Visualizing 30-day submission volumes and urgency scores via Recharts.

### ✨ AI 5-Step Action Plan Generator
- For any highly ranked priority, officials can click the "Generate Plan" button. The LLM instantly outputs a structured **5-step execution plan**, timeline, and budget estimate in a beautiful glassmorphic UI.

---

## 🛠️ Tech Stack

### Frontend
- **React.js & Vite** for lightning-fast UI rendering
- **Tailwind CSS** for a premium, glassmorphic, and fully responsive design
- **Recharts & React-Leaflet** for trend analysis and geographic hotspot mapping
- **Firebase Hosting** for global CDN deployment

### Backend
- **Node.js & Express.js** for robust API endpoints
- **MongoDB** for flexible NoSQL data storage (Wards, Submissions, Projects)
- **Groq API (Llama-3.3-70b-versatile)** for near-instantaneous NLP inference, translation, urgency scoring, and plan generation
- **Google Cloud Run** for highly scalable, containerized backend hosting

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (or local MongoDB)
- Groq API Key

### 1. Clone the Repository
```bash
git clone https://github.com/NISHANTH-KONCHADA/peoples-priorities.git
cd peoples-priorities
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=supersecretjwtkey_hackathon_only
PORT=8080
```
Seed the database and start the server:
```bash
npx ts-node src/seed.ts
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env.local` file in the `client` directory:
```env
VITE_API_URL=http://localhost:8080
```
Start the Vite development server:
```bash
npm run dev
```

---

<div align="center">
  <i>Built with ❤️ for the Hackathon</i>
</div>
