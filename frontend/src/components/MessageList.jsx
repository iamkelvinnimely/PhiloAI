import { useEffect, useRef } from 'react';
import Message from './Message.jsx';

export default function MessageList({ messages, streaming }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return undefined;
    }

    const onScroll = () => {
      const threshold = 96;
      stickToBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (messages[messages.length - 1]?.role === 'user') {
      stickToBottom.current = true;
    }
    if (!stickToBottom.current) {
      return;
    }
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streaming]);

  const lastIndex = messages.length - 1;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {messages.map((message, index) => (
          <Message
            key={`${message.role}-${index}`}
            message={message}
            isStreaming={
              streaming && index === lastIndex && message.role === 'assistant'
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
