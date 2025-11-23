# Company Research Assistant

AI-powered workflow to research companies and generate professional account plans. Frontend in React + Vite, backend in Node/Express using **LangChain + Groq (Llama 3.3 70B Versatile)** for fast, structured reasoning.

## 🔍 Key Features

- Conversational research assistant (chat + optional voice input)
- Phase-based company research synthesis
- Structured 10-section account plan generator (editable inline)
- Section-level AI refinement via natural language instructions
- Fast PDF export (jsPDF) of finalized account plan
- Dark/light theme toggle persisted locally

## 🏗️ Architecture Overview

### Frontend (React + Vite)
Components: `ChatInterface`, `ResearchPanel`, `AccountPlan`, `VoiceControl`, plus global styling and tab state in `App.jsx`.

### Backend (Node + Express)
Endpoints: `/api/chat`, `/api/research`, `/api/generate-plan`, `/api/update-section`, `/api/health`.

### AI Layer
LangChain Runnable chains wrapping Groq Llama 3.3 models. Conversation history passed from client. Research + plan generation use multi-step prompting and string composition.

## 📋 Prerequisites

- Node.js v20.19+ or v22.12+
- npm v10+
- Groq API key (https://console.groq.com/keys)

## 🚀 Quick Setup

```powershell
# From project root
npm install
cd server; npm install; cd ..

# Frontend .env
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Backend .env (edit GROQ key manually if using PowerShell)
cd server
echo "GROQ_API_KEY=YOUR_KEY_HERE" > .env
echo "PORT=3001" >> .env
cd ..
```

## 💻 Run (Development)

```powershell
# Terminal 1 (backend)
cd server
npm run dev

# Terminal 2 (frontend)
npm run dev
```

Frontend: http://localhost:5173  |  Backend: http://localhost:3001

### Build (Production)
```powershell
npm run build
cd server
npm start
```

## 📖 Usage Flow

### 1. Chat Mode
- Start a conversation with the AI agent
- Ask about companies: "Research Microsoft"
- Request account plans: "Generate an account plan for Tesla"
- Get insights: "Tell me about Apple's market position"

### 2. Research Mode
- Enter a company name in the search box
- Watch real-time research progress
- View comprehensive research findings
- Generate account plan from research

### 3. Account Plan Mode
10 auto-generated sections (Executive Summary → Risk Assessment). Edit inline, then export PDF.

### 4. Voice Mode
- Click "Voice On" to enable voice interaction
- Click microphone icon to speak
- AI responses are read aloud automatically
- Toggle speech output on/off

## 🎯 Example Prompts

### Research a Company
**User**: "Research Tesla"
**AI**: *Provides real-time updates*
- "Starting research on Tesla... Gathering basic company information."
- "Analyzing market position and competitors..."
- "Looking into financial data and business model..."
- "Synthesizing findings from multiple sources..."
**Result**: Comprehensive research report

### Generate Account Plan
**User**: "Generate an account plan for Tesla"
**AI**: Creates a detailed 10-section account plan
**User**: Can then edit specific sections

### Update Section
1. Navigate to Account Plan tab
2. Click "Edit" on any section
3. Provide instructions: "Add more details about competitive advantages"
4. AI updates the section intelligently

## 🛠️ Stack

Frontend: React, Vite, Axios, React Markdown, Speech Recognition, Lucide Icons, jsPDF.
Backend: Node, Express, LangChain, Groq API, dotenv, cors.

## 📁 Structure

```
company-research-assistant/
├── src/
│   ├── components/
│   │   ├── ChatInterface.jsx      # Chat UI component
│   │   ├── VoiceControl.jsx       # Voice interaction
│   │   ├── ResearchPanel.jsx      # Research interface
│   │   └── AccountPlan.jsx        # Account plan display
│   ├── services/
│   │   └── api.js                 # API service layer
│   ├── styles/
│   │   ├── ChatInterface.css
│   │   ├── VoiceControl.css
│   │   ├── ResearchPanel.css
│   │   └── AccountPlan.css
│   ├── App.jsx                    # Main application
│   ├── App.css                    # Global styles
│   └── main.jsx                   # Entry point
├── server/
│   ├── server.js                  # Express server
│   ├── package.json               # Server dependencies
│   └── .env.example               # Server env template
├── package.json                    # Frontend dependencies
├── .env.example                    # Frontend env template
├── vite.config.js                  # Vite configuration
└── README.md                       # This file
```

## 🔧 Config Notes

### API Configuration
Modify `VITE_API_URL` in `.env` to change the backend API endpoint.

### OpenAI Model
Edit `server/server.js` to change the model:
```javascript
model: 'gpt-4o-mini',  // Change to 'gpt-4', 'gpt-3.5-turbo', etc.
```

### Temperature & Tokens
Adjust AI behavior in `server/server.js`:
```javascript
temperature: 0.7,      // Creativity (0-1)
max_tokens: 2000,      // Response length
```

## 🐛 Troubleshooting (Quick)

### Server Connection Issues
1. Ensure backend is running on port 3001
2. Check `.env` configuration
3. Verify CORS settings in `server/server.js`

### Voice Recognition Not Working
- Use Chrome, Edge, or Safari (Firefox has limited support)
- Ensure microphone permissions are granted
- Check browser console for errors

### OpenAI API Errors
- Verify API key is correct
- Check API quota and billing
- Ensure network connectivity

### Build Issues
Delete `node_modules` + `package-lock.json` then reinstall:
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 🔒 Security

- Never commit `.env` files to version control
- Keep OpenAI API key secure
- Use environment variables for sensitive data
- Implement rate limiting for production
- Add authentication for multi-user scenarios

## 🚀 Deployment (Outline)

### Frontend (Vercel, Netlify, etc.)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variable: `VITE_API_URL`

### Backend (Heroku, Railway, etc.)
1. Deploy the `server` folder
2. Set environment variables:
   - `OPENAI_API_KEY`
   - `PORT`
3. Ensure CORS allows frontend domain

## 📝 API (Brief)

### POST /api/chat
Chat with the AI agent.

**Request Body**:
```json
{
  "conversationId": "conv-123",
  "message": "Research Microsoft",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response**:
```json
{
  "message": "I'll research Microsoft for you...",
  "role": "assistant"
}
```

### POST /api/research
Research a company.

**Request Body**:
```json
{
  "companyName": "Tesla"
}
```

**Response**:
```json
{
  "phases": [...],
  "research": "Comprehensive research text..."
}
```

### POST /api/generate-plan
Generate an account plan.

**Request Body**:
```json
{
  "companyName": "Tesla",
  "researchData": "Research findings...",
  "additionalContext": "Focus on EV market"
}
```

**Response**:
```json
{
  "fullText": "Complete plan text...",
  "sections": {
    "Executive Summary": "...",
    "Company Overview": "...",
    ...
  }
}
```

### POST /api/update-section
Update a plan section.

**Request Body**:
```json
{
  "sectionName": "Executive Summary",
  "currentContent": "Current content...",
  "updateInstructions": "Add more financial details"
}
```

**Response**:
```json
{
  "updatedContent": "Updated content..."
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a pull request

## 📄 License
Educational / internal use.

## 🙏 Acknowledgments
Groq, React, Vite, LangChain, jsPDF & OSS ecosystem.

## 📧 Support
Open an issue or contact maintainer.

---
Cleaned: Removed legacy setup/troubleshooting markdown files & unused dependency (html2canvas). README condensed for maintainability.
- Check the troubleshooting section
- Review API documentation
- Consult OpenAI documentation: https://platform.openai.com/docs

---

**Built with ❤️ using React, Node.js, and OpenAI GPT-4**

