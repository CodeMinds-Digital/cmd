/** Centered card for the signed-out pages (login, two-factor, password). */
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 font-display text-lg font-bold text-fg">
          Codeminds<span className="text-accent">.</span> <span className="font-sans text-sm font-normal text-fg-muted">Admin</span>
        </p>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="mb-5 font-display text-2xl font-bold text-fg">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
