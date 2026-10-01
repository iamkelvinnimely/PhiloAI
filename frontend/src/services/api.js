const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SERVER_UNAVAILABLE =
  'Unable to connect to the server.\nPlease try again.';
export const LLM_UNAVAILABLE =
  'The AI service is temporarily unavailable.\nPlease try again.';
export const INVALID_REQUEST = 'Please enter a message and try again.';

async function parseError(response) {
  if (response.status === 422) {
    return INVALID_REQUEST;
  }

  try {
    const data = await response.json();
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
  } catch {
    // Fall through to status-based messages.
  }

  if (response.status >= 500) {
    return LLM_UNAVAILABLE;
  }

  return SERVER_UNAVAILABLE;
}

function parseSseBlock(block) {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  const data = dataLines.join('\n').trim();
  if (!data) {
    return { type: 'ignore' };
  }

  if (event === 'error') {
    try {
      const parsed = JSON.parse(data);
      return {
        type: 'error',
        message: parsed.message || LLM_UNAVAILABLE,
      };
    } catch {
      return { type: 'error', message: LLM_UNAVAILABLE };
    }
  }

  if (data === '[DONE]') {
    return { type: 'done' };
  }

  try {
    const parsed = JSON.parse(data);
    return { type: 'chunk', content: parsed.content || '' };
  } catch {
    return { type: 'ignore' };
  }
}

export async function checkHealth() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/health`);
  } catch {
    throw new Error(SERVER_UNAVAILABLE);
  }

  if (!response.ok) {
    throw new Error(SERVER_UNAVAILABLE);
  }

  return response.json();
}

export async function sendChat(messages) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new Error(SERVER_UNAVAILABLE);
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  const content = data?.message?.content;
  if (!content) {
    throw new Error(LLM_UNAVAILABLE);
  }
  return content;
}

export async function streamChat(messages, { onChunk, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new Error(SERVER_UNAVAILABLE);
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (!response.body) {
    throw new Error(SERVER_UNAVAILABLE);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedContent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const event = parseSseBlock(part);
        if (event.type === 'chunk' && event.content) {
          receivedContent = true;
          onChunk?.(event.content);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      }
    }

    if (buffer.trim()) {
      const event = parseSseBlock(buffer);
      if (event.type === 'chunk' && event.content) {
        receivedContent = true;
        onChunk?.(event.content);
      } else if (event.type === 'error') {
        throw new Error(event.message);
      }
    }

    if (!receivedContent) {
      throw new Error(LLM_UNAVAILABLE);
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    if (receivedContent) {
      throw error;
    }
    throw error instanceof Error ? error : new Error(SERVER_UNAVAILABLE);
  }
}
