import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingIndicator from './LoadingIndicator.jsx';

export default function Message({ message, isStreaming = false }) {
  const isUser = message.role === 'user';
  const isEmptyAssistant = !isUser && !message.content;

  return (
    <article
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      aria-label={isUser ? 'Your message' : 'Assistant message'}
    >
      <div
        className={`max-w-[min(100%,42rem)] ${
          isUser
            ? 'rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-900'
            : 'px-1 py-1 text-zinc-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </p>
        ) : isEmptyAssistant ? (
          <LoadingIndicator />
        ) : (
          <div className="markdown text-[15px] leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sky-400 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-300"
                  >
                    {children}
                  </a>
                ),
                code: ({ className, children }) => {
                  const isBlock = Boolean(className);
                  if (!isBlock) {
                    return (
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-100">
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className={`${className ?? ''} font-mono text-[0.85em]`}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming ? (
              <span
                className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-zinc-300"
                aria-hidden="true"
              />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
