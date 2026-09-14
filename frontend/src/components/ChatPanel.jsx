import { useEffect, useRef, useState } from 'react';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatPanel({ open, onClose, messages, onSend, userName }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  function submit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  return (
    <aside
      className={`fixed right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-graphite-800 bg-graphite-900 shadow-panel transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-graphite-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-paper">Discussion</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close discussion panel"
          className="text-graphite-600 hover:text-paper"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className="thin-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-sm text-graphite-600">
            No messages yet. Say something about the board.
          </p>
        )}
        {messages.map((m) => (
          <div key={m._id || `${m.userName}-${m.createdAt}-${m.text}`}>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xs font-semibold ${
                  m.userName === userName ? 'text-clay' : 'text-graphite-600'
                }`}
              >
                {m.userName}
              </span>
              <span className="text-[11px] text-graphite-700">{formatTime(m.createdAt)}</span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-paper">{m.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="border-t border-graphite-800 p-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="Message the team…"
            className="flex-1 rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
          />
          <button
            type="submit"
            className="rounded-lg bg-clay px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
