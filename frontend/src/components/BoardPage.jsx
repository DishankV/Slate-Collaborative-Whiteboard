import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { fetchBoard, verifyBoardPassword } from '../utils/api';
import Whiteboard from './Whiteboard.jsx';

export default function BoardPage() {
  const { boardId } = useParams();
  const location = useLocation();
  const prefill = location.state || {};

  const [status, setStatus] = useState('loading'); // loading | gate | ready | not-found
  const [board, setBoard] = useState(null);
  const [name, setName] = useState(prefill.userName || '');
  const [password, setPassword] = useState(prefill.password || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(null); // { userName, password } once confirmed

  useEffect(() => {
    let cancelled = false;
    fetchBoard(boardId)
      .then((b) => {
        if (cancelled) return;
        setBoard(b);
        // If we arrived from the Home form, we already collected name (and
        // password, if any) there — skip straight to the board.
        if (prefill.userName) {
          setJoined({ userName: prefill.userName, password: prefill.password || '' });
          setStatus('ready');
        } else {
          setStatus('gate');
        }
      })
      .catch(() => !cancelled && setStatus('not-found'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  async function handleGateSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name to continue.');
    setBusy(true);
    try {
      if (board?.hasPassword) {
        const result = await verifyBoardPassword(boardId, password);
        if (!result.ok) {
          setError('Incorrect password.');
          setBusy(false);
          return;
        }
      }
      setJoined({ userName: name.trim(), password });
      setStatus('ready');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return <CenteredMessage title="Loading board…" />;
  }

  if (status === 'not-found') {
    return (
      <CenteredMessage
        title="Board not found"
        subtitle="Double-check the link, or ask whoever shared it to resend it."
      />
    );
  }

  if (status === 'ready' && joined) {
    return <Whiteboard boardId={boardId} userName={joined.userName} password={joined.password} board={board} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <form
        onSubmit={handleGateSubmit}
        className="w-full max-w-sm rounded-2xl bg-graphite-900 p-6 shadow-panel"
      >
        <h1 className="text-lg font-semibold text-paper">{board?.name || 'Join board'}</h1>
        <p className="mt-1 text-sm text-graphite-600">Enter your name to join this board.</p>

        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your name"
            autoFocus
            className="w-full rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
          />
          {board?.hasPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Board password"
              className="w-full rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
            />
          )}
          {error && <p className="text-sm text-[#DE5C5C]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-clay py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Checking…' : 'Join board'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CenteredMessage({ title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-graphite-950 px-4 text-center">
      <h1 className="text-lg font-semibold text-paper">{title}</h1>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-graphite-600">{subtitle}</p>}
    </div>
  );
}
