# PhiloAi — Backend

FastAPI server that proxies chat requests to a Groq (OpenAI-compatible) LLM.

## Setup

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Add your Groq API key to `.env` as `LLM_API_KEY`. Get a key at [console.groq.com](https://console.groq.com).

## Run

From this `backend/` directory:

```powershell
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

- Health: `GET http://localhost:8000/api/health`
- Chat: `POST http://localhost:8000/api/chat`
- Stream: `POST http://localhost:8000/api/chat/stream`
