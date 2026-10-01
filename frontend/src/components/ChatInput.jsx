import { useEffect, useRef } from 'react';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  streaming = false,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        onSubmit();
      }
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-3xl px-4 pb-5 pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) {
          onSubmit();
        }
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 shadow-lg shadow-black/20 focus-within:border-zinc-500">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          placeholder="Ask me anything..."
          className="max-h-52 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={disabled}
          aria-label={streaming ? 'Sending' : 'Send message'}
          className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {streaming ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.4 20.6 21 12 3.4 3.4l.1 7.1L15 12 3.5 13.5z" />
    </svg>
  );
}
