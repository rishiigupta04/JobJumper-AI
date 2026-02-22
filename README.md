# JobJumper: Autonomous Career AI Agent 🚀

![JobJumper Banner](https://picsum.photos/1200/400?blur=2)

JobJumper is a cutting-edge, AI-powered career copilot designed to automate the most tedious aspects of the job search process. Built with a modern **React + TypeScript** frontend and a robust **Python + LangChain** backend, it leverages advanced Large Language Models (LLMs) to analyze job descriptions, generate tailored application materials, conduct deep company research, and prepare candidates for interviews.

## 🌟 Key Features

### 1. 🧠 Intelligent Job Analyzer
- **Deep Match Analysis:** Uses LLMs to semantic-match your resume against job descriptions (JDs).
- **Gap Identification:** Highlights missing skills and experience gaps.
- **Actionable Feedback:** Provides a compatibility score and specific advice to improve your application.

### 2. 📝 Strategic Document Architect
- **Automated Drafting:** Generates hyper-personalized cover letters, resume bullet points, and LinkedIn outreach messages.
- **Tone & Style Control:** Choose from various professional tones (e.g., Confident, Enthusiastic, Data-Driven).
- **Context Awareness:** Injects specific project details and achievements relevant to the target role.

### 3. 🎯 Interview Prep Agent
- **STAR Method Training:** Generates behavioral questions and structures answers using the Situation-Task-Action-Result framework.
- **Technical Deep Dives:** Predicts technical questions based on the specific tech stack mentioned in the JD.
- **Mock Interview Simulation:** (Planned) Interactive voice-based mock interviews.

### 4. 🕵️ Deep Research Agent
- **Company Intelligence:** Scrapes and synthesizes data on company mission, culture, and recent news.
- **Market Analysis:** Analyzes competitors and market positioning.
- **Red Flag Detection:** Scans employee reviews (Glassdoor, Reddit, Blind) to identify potential toxic work environments.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** [React 18](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Context API + LocalStorage
- **Icons:** [Lucide React](https://lucide.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)

### Backend (Server - *Conceptual Architecture*)
- **Runtime:** [Python 3.10+](https://www.python.org/)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Orchestration:** [LangChain](https://www.langchain.com/)
- **LLM Integration:** Google Gemini Pro / OpenAI GPT-4
- **Vector Store:** [ChromaDB](https://www.trychroma.com/) (for RAG on resume/history)
- **Tools:** Serper Dev (Google Search), BeautifulSoup (Web Scraping)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- API Keys for Gemini/OpenAI and Serper

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jobjumper-ai.git
   cd jobjumper-ai
   ```

2. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Environment Variables**
   Create a `.env` file in both `client` and `server` directories:
   ```env
   # Server .env
   GOOGLE_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   SERPER_API_KEY=your_serper_key

   # Client .env
   VITE_API_URL=http://localhost:8000
   ```

---

## 📐 Architecture Overview

The application follows a **Retrieval-Augmented Generation (RAG)** pattern for personalized insights:

1. **Ingestion:** User uploads a resume (PDF/Text), which is parsed and chunked into a vector store.
2. **Context Retrieval:** When a user pastes a Job Description, the system retrieves relevant resume sections.
3. **Agent Execution:**
   - The **Analyzer Agent** compares the retrieved context with the JD.
   - The **Research Agent** uses LangChain tools to search the web for real-time company data.
   - The **Writer Agent** synthesizes the context into a structured document.
4. **Response Streaming:** The Python backend streams the LLM response back to the React frontend for a responsive UX.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ by [Rishi](https://github.com/rishirajgupta04)**
