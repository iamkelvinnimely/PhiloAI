import { useRef, useState } from 'react';
import ChatInput from './ChatInput.jsx';
import EmptyState from './EmptyState.jsx';
import MessageList from './MessageList.jsx';
import { streamChat } from '../services/api.js';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  function handleNewChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setInput('');
    setError(null);
    setIsStreaming(false);
  }

  async function sendMessage(text) {
    const content = text.trim();
    if (!content || isStreaming) {
      return;
    }

    const history = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(history, {
        signal: controller.signal,
        onChunk(chunk) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (!last || last.role !== 'assistant') {
              return current;
            }
            next[next.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return next;
          });
        },
      });
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
      setError(err?.message || 'Unable to connect to the server.\nPlease try again.');
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return current.slice(0, -1);
        }
        return current;
      });
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }

  const canSend = Boolean(input.trim()) && !isStreaming;

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold">
              P
            </span>
            <span className="text-sm font-medium tracking-tight">PhiloAi</span>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            New Chat
          </button>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState onSuggestion={sendMessage} />
      ) : (
        <MessageList messages={messages} streaming={isStreaming} />
      )}

      {error ? (
        <div
          className="mx-auto w-full max-w-3xl px-4"
          role="alert"
        >
          <p className="mb-2 whitespace-pre-line rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        </div>
      ) : null}

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => sendMessage(input)}
        disabled={!canSend}
        streaming={isStreaming}
      />
    </div>
  );
}
