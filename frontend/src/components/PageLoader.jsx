export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-soft border-t-flare-hot" />
        <p className="font-mono-price text-xs tracking-widest text-muted uppercase">Loading</p>
      </div>
    </div>
  );
}
