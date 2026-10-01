const SUGGESTIONS = [
  'Explain quantum computing simply',
  'Give me ideas for a software project',
  'Help me write a Python function',
];

export default function EmptyState({ onSuggestion }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-100 shadow-inner">
        <SparkIcon />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        PhiloAi
      </h1>
      <p className="mt-3 text-base text-zinc-400 sm:text-lg">
        How can I help you today?
      </p>
      <div className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSuggestion(prompt)}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-9 9-2 2m13 0-2-2m-9-9-2-2"
      />
    </svg>
  );
}
