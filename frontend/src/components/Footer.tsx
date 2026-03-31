export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div>
          <a href="/" className="text-lg font-heading font-extrabold tracking-tight">
            <span className="text-white">Real</span>
            <span className="text-blue-400">Text</span>
          </a>
          <p className="text-sm mt-1 text-slate-500">Free AI text detector and humanizer.</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a href="/app" className="hover:text-white transition-colors">Tool</a>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          <a href="/blog/come-capire-testo-ai.html" className="hover:text-white transition-colors">Blog</a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-5 pb-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; 2026 RealText
      </div>
    </footer>
  );
}
