export default function LoadingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 py-1"
      role="status"
      aria-live="polite"
      aria-label="Assistant is responding"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
    </div>
  );
}
