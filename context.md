# AI Chatbot — Project Context

## 1. Project Overview

Build a simple, modern AI chatbot inspired by the core experience of ChatGPT.

This is a portfolio project. The goal is **not** to build or train an LLM. The application will use an existing LLM through a third-party API.

The first version should be intentionally simple:

> React/Vite frontend → Python/FastAPI backend → LLM API → streamed response → React UI

Do not introduce unnecessary infrastructure or features in V1.

---

# 2. Main Goals

The application should allow a user to:

1. Open the application.
2. Enter a message.
3. Send the message to the Python backend.
4. Have the backend send the conversation to an LLM provider.
5. Receive the AI response.
6. Display the response in a ChatGPT-like interface.
7. Stream the AI response as it is generated.
8. Start a new conversation.

The application should feel polished even though the underlying architecture is simple.

---

# 3. Technology Stack

## Frontend

Use:

* React
* Vite
* JavaScript
* Tailwind CSS
* Fetch API
* React state/hooks

Do not use Next.js.

Do not introduce a state-management library unless it becomes necessary.

---

## Backend

Use:

* Python
* FastAPI
* Uvicorn
* Pydantic
* `python-dotenv` or equivalent environment configuration

Do not use Django.

Do not use Flask.

FastAPI is sufficient for the current scope.

---

## LLM

The application should use a third-party LLM API.

The implementation should be provider-independent where reasonably possible.

Initially use ONE provider.

Possible providers include:

* Google Gemini
* Groq
* OpenRouter
* Another provider with a suitable free/rate-limited API

The provider should be configurable through environment variables.

Never expose the LLM API key to the React frontend.

---

# 4. High-Level Architecture

```text
                    USER
                      │
                      ▼
             ┌─────────────────┐
             │   React + Vite  │
             │                 │
             │    Chat UI      │
             └────────┬────────┘
                      │
                HTTP / SSE
                      │
                      ▼
             ┌─────────────────┐
             │     FastAPI     │
             │                 │
             │  Chat Endpoint  │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │   LLM Service   │
             │                 │
             │ Provider Adapter│
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │   LLM Provider  │
             │                 │
             │     Model       │
             └─────────────────┘
```

---

# 5. Important Architectural Principle

Keep the LLM integration separate from the API routes.

Do NOT put all LLM logic directly inside the FastAPI route.

Prefer:

```text
routes/
    chat.py

services/
    llm.py
```

The route should handle HTTP concerns.

The LLM service should handle communication with the model.

Example conceptual structure:

```python
@router.post("/chat")
async def chat(request: ChatRequest):
    return await llm_service.generate(request.messages)
```

The exact implementation can differ.

---

# 6. Project Structure

Use a structure similar to:

```text
ai-chatbot/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── Message.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── LoadingIndicator.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   │
│   ├── app/
│   │   ├── routes/
│   │   │   └── chat.py
│   │   │
│   │   ├── services/
│   │   │   └── llm.py
│   │   │
│   │   ├── schemas/
│   │   │   └── chat.py
│   │   │
│   │   └── main.py
│   │
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
│
├── .gitignore
└── README.md
```

Keep the structure clean but do not create unnecessary folders.

---

# 7. V1 Features

## 7.1 Chat Interface

The main screen should contain:

* Application/logo name
* New Chat button
* Message area
* User messages
* Assistant messages
* Message input
* Send button
* Loading/streaming state

The interface should resemble a modern AI assistant without copying ChatGPT's branding or exact UI.

---

# 8. Empty State

When there are no messages, display a simple centered welcome screen.

Example:

```text
            AI Assistant

       How can I help you today?

   ┌───────────────────────────────────┐
   │ Ask me anything...                │
   └───────────────────────────────────┘
```

Optionally include a few suggestion prompts:

```text
Explain quantum computing simply
Give me ideas for a software project
Help me write a Python function
```

Clicking a suggestion should place/send that prompt.

---

# 9. Message Behavior

User messages should appear immediately after sending.

Assistant messages should appear as the response is streamed.

Example:

```text
User:
What is artificial intelligence?

Assistant:
Artificial intelligence is...
```

The assistant message should update progressively while the response is being received.

---

# 10. Streaming

Streaming is an important V1 feature.

The application should not wait for the entire response before displaying it.

Preferred architecture:

```text
React
  │
  │ POST /api/chat/stream
  ▼
FastAPI
  │
  │ stream request
  ▼
LLM Provider
  │
  │ token/chunk stream
  ▼
FastAPI
  │
  │ SSE
  ▼
React
  │
  ▼
Progressively update assistant message
```

Use Server-Sent Events (SSE) where practical.

The frontend should handle:

* connection
* incoming chunks
* updating the current assistant message
* completion
* errors
* connection interruption

---

# 11. Conversation State

V1 does NOT require a database.

Store the current conversation in React state.

Example:

```javascript
[
  {
    role: "user",
    content: "What is Python?"
  },
  {
    role: "assistant",
    content: "Python is a programming language..."
  }
]
```

When sending a new message, send the conversation history to the backend.

The backend then sends the relevant messages to the LLM.

---

# 12. API Contract

## POST `/api/chat/stream`

Request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help?"
    },
    {
      "role": "user",
      "content": "Tell me about Python"
    }
  ]
}
```

The backend should validate the request using Pydantic.

The response should be a streaming response.

---

# 13. Non-Streaming Endpoint

It is acceptable to initially implement:

```text
POST /api/chat
```

before implementing:

```text
POST /api/chat/stream
```

This can be useful for testing the LLM connection.

However, the final V1 experience should use streaming.

---

# 14. Backend Environment Variables

Use `.env`.

Example:

```env
LLM_API_KEY=your_api_key_here
LLM_MODEL=your_model_name
LLM_PROVIDER=gemini
```

Do not hardcode credentials.

Provide:

```text
.env.example
```

containing placeholder values.

Never commit `.env`.

---

# 15. Security Requirements

The LLM API key must NEVER be placed in:

* React source code
* Vite environment variables exposed to the browser
* frontend JavaScript
* HTML
* Git repository

The API key belongs exclusively on the backend.

Correct:

```text
React
   ↓
FastAPI
   ↓
LLM API
```

Incorrect:

```text
React
   ↓
LLM API
```

---

# 16. CORS

During development, configure FastAPI CORS to allow the Vite development server.

Typical development origin:

```text
http://localhost:5173
```

Do not allow every origin in the final production configuration.

Use environment-based configuration when appropriate.

---

# 17. Error Handling

The application should gracefully handle:

### Backend unavailable

Display something like:

```text
Unable to connect to the server.
Please try again.
```

### LLM API error

Display:

```text
The AI service is temporarily unavailable.
Please try again.
```

### Invalid request

Display an appropriate user-friendly error.

### Streaming interruption

Do not crash the application.

The partially generated response may remain visible and the user should be able to try again.

---

# 18. UI/UX Requirements

The UI should be:

* Clean
* Modern
* Minimal
* Responsive
* Mobile-friendly
* Desktop-friendly
* Fast
* Accessible

Use a neutral modern design.

Do not make it unnecessarily complicated.

---

# 19. Chat Input

The input should:

* Support multiline text
* Expand reasonably as the user types
* Send with Enter
* Use Shift + Enter for a new line
* Disable sending when appropriate
* Show a loading/streaming state
* Clear after successful submission

The send button should be visually obvious.

---

# 20. Message Rendering

Assistant responses should support Markdown.

Support at minimum:

* Paragraphs
* Headings
* Bold
* Italic
* Lists
* Links
* Code blocks
* Inline code

Code blocks should be visually separated from normal text.

A Markdown rendering library can be used rather than implementing Markdown parsing manually.

---

# 21. Auto Scroll

The message container should automatically scroll to the newest content while the assistant is responding.

Avoid aggressive scrolling that prevents the user from manually reading older messages.

---

# 22. New Chat

The New Chat button should:

1. Clear the current conversation.
2. Reset the UI.
3. Return to the empty state.

No database interaction is required in V1.

---

# 23. Model Abstraction

Although V1 uses one LLM provider, avoid tightly coupling the entire application to that provider.

Conceptually:

```text
FastAPI
   │
   ▼
LLM Service
   │
   ▼
Provider Adapter
   │
   ▼
Gemini / Groq / OpenRouter
```

For example:

```text
services/
    llm.py
```

can expose a simple interface such as:

```python
generate_response(messages)
stream_response(messages)
```

The rest of the application should not need to know provider-specific implementation details.

---

# 24. No Database in V1

Do NOT add:

* PostgreSQL
* MongoDB
* Redis
* Celery
* Docker
* Kubernetes

unless there is a specific reason later.

The purpose of V1 is to prove the core product works.

---

# 25. No Authentication in V1

Do NOT implement:

* Login
* Registration
* OAuth
* Password reset
* User profiles

These belong to a future version.

---

# 26. No Advanced AI Features in V1

Do NOT implement yet:

* RAG
* Vector databases
* Agents
* Tool calling
* Web search
* File uploads
* Image generation
* Voice chat
* Long-term memory
* Fine-tuning
* Multiple agents

These can be considered later.

---

# 27. V1 Development Order

Build in this exact general order.

## Step 1 — Project Setup

Create:

```text
frontend/
backend/
```

Initialize React/Vite and FastAPI.

Verify both run locally.

---

## Step 2 — Basic FastAPI Server

Create:

```text
GET /api/health
```

Expected:

```json
{
  "status": "ok"
}
```

Verify the frontend can communicate with the backend.

---

## Step 3 — Connect LLM

Implement:

```text
POST /api/chat
```

Test the LLM connection independently before building streaming.

---

## Step 4 — Build Chat UI

Implement:

* Empty state
* Message list
* Message bubbles
* Input
* Send button

Initially use non-streaming responses.

---

## Step 5 — Add Conversation History

Maintain messages in React state and send the relevant history to the backend.

---

## Step 6 — Add Streaming

Implement:

```text
POST /api/chat/stream
```

Use SSE or another simple streaming mechanism supported by FastAPI.

Update the assistant message progressively.

---

## Step 7 — Markdown

Add Markdown rendering for assistant responses.

---

## Step 8 — Error Handling

Handle:

* API errors
* Backend errors
* Network errors
* Streaming failures
* Empty messages

---

## Step 9 — UI Polish

Improve:

* Responsive layout
* Loading states
* Animations
* Empty state
* Typography
* Spacing
* Message presentation

Do not sacrifice simplicity for visual effects.

---

# 28. Definition of Done — V1

V1 is complete when:

* [ ] React/Vite frontend works.
* [ ] FastAPI backend works.
* [ ] Frontend communicates with backend.
* [ ] Backend communicates with the LLM.
* [ ] User can send messages.
* [ ] AI can respond.
* [ ] Conversation history works within the current session.
* [ ] AI responses stream progressively.
* [ ] Markdown works.
* [ ] Code blocks work.
* [ ] New Chat works.
* [ ] Errors are handled gracefully.
* [ ] API key is securely stored on the backend.
* [ ] Application works on mobile and desktop.
* [ ] No unnecessary database or infrastructure has been introduced.

---

# 29. Future Roadmap

After V1 is stable, possible V2 features:

### V2 — Persistent Conversations

Add:

```text
SQLite/PostgreSQL
```

Store:

```text
User
Conversation
Message
```

---

### V3 — Authentication

Add:

```text
Register
Login
Logout
User accounts
```

---

### V4 — Multiple Models

Allow users to select models:

```text
Gemini
Groq
OpenRouter
```

The LLM abstraction should make this easier.

---

### V5 — AI Features

Potential features:

```text
File uploads
Document analysis
Web search
RAG
Image understanding
Voice input
Tool calling
```

---

# 30. Development Philosophy

The most important rule:

> **Do not overengineer V1.**

Prefer:

```text
simple → working → clean → extensible
```

over:

```text
complex → impressive architecture → unfinished
```

Build the smallest useful version first.

Do not create abstractions simply because they might be useful someday.

However, keep obvious boundaries between:

```text
Frontend
API
LLM service
```

so future development remains manageable.

---

# 31. Cursor Instructions

When implementing this project:

1. Inspect the existing project before creating files.
2. Do not unnecessarily rewrite existing code.
3. Follow the architecture described above.
4. Keep dependencies minimal.
5. Do not introduce Django.
6. Do not introduce a database in V1.
7. Do not expose API keys to the frontend.
8. Keep provider-specific LLM code inside the backend service layer.
9. Implement and test one feature at a time.
10. Prefer simple, readable code over clever abstractions.
11. Handle errors explicitly.
12. Keep frontend and backend responsibilities separate.
13. Do not add future features unless explicitly requested.
14. After implementing a feature, verify that it works before moving to the next major feature.

---

# 32. Product Vision

This project should eventually become a polished personal AI assistant platform.

The initial version is intentionally small, but the architecture should leave room for:

```text
                 AI ASSISTANT
                      │
       ┌──────────────┼──────────────┐
       │              │              │
     Chat           Files          Search
       │              │              │
       └──────────────┼──────────────┘
                      │
                 AI Models
                      │
             ┌────────┼────────┐
             │        │        │
           Gemini    Groq   OpenRouter
```

But **none of those advanced features should be built now**.

The immediate objective is simple:

> **Build a working ChatGPT-like chatbot with React + Vite, FastAPI, and one free/low-cost LLM API, with streaming responses.**
