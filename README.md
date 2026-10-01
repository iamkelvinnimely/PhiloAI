# PhiloAi

A simple chatbot: React + Vite frontend, FastAPI backend, and Groq for the model.

```text
React / Vite  →  FastAPI  →  Groq  →  streamed reply
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- A free Groq API key from [console.groq.com](https://console.groq.com/keys)

## Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set `LLM_API_KEY`. Then:

```powershell
uvicorn app.main:app --reload --port 8000
```

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The UI talks to the backend at `http://localhost:8000`.

## Environment

`backend/.env` (never commit this file):

```env
LLM_API_KEY=your_api_key_here
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-20b
LLM_BASE_URL=https://api.groq.com/openai/v1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

The LLM API key stays on the backend only.
