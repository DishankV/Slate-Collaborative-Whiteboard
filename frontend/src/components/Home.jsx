import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBoard } from '../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [boardName, setBoardName] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name so teammates recognise you.');
    setBusy(true);
    try {
      const board = await createBoard({
        name: boardName || 'Untitled board',
        createdBy: name,
        password,
      });
      navigate(`/board/${board.boardId}`, {
        state: { userName: name.trim(), password },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name so teammates recognise you.');
    const code = boardCode.trim();
    if (!code) return setError('Enter the board code your teammate shared.');
    navigate(`/board/${code}`, { state: { userName: name.trim(), password } });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-xl font-bold text-white">
            S
          </div>
          <h1 className="text-2xl font-semibold text-paper">Slate</h1>
          <p className="mt-1 text-sm text-graphite-600">
            A shared canvas for your team to sketch ideas and talk them through, live.
          </p>
        </div>

        <div className="rounded-2xl bg-graphite-900 p-6 shadow-panel">
          <div className="mb-5 flex rounded-lg bg-graphite-800 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'create' ? 'bg-graphite-700 text-paper' : 'text-graphite-600'
              }`}
            >
              New board
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 rounded-md py-1.5 font-medium transition ${
                mode === 'join' ? 'bg-graphite-700 text-paper' : 'text-graphite-600'
              }`}
            >
              Join a board
            </button>
          </div>

          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-graphite-600">Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Priya Shah"
                className="w-full rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
              />
            </div>

            {mode === 'create' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite-600">Board name</label>
                <input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  maxLength={80}
                  placeholder="Q3 roadmap brainstorm"
                  className="w-full rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-graphite-600">Board code</label>
                <input
                  value={boardCode}
                  onChange={(e) => setBoardCode(e.target.value)}
                  placeholder="a1b2c3d4"
                  className="w-full rounded-lg bg-graphite-800 px-3 py-2 font-mono text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-graphite-600">
                Password {mode === 'create' && <span className="text-graphite-700">(optional)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'create' ? 'Leave blank for an open board' : 'Only if the board is protected'}
                className="w-full rounded-lg bg-graphite-800 px-3 py-2 text-sm text-paper placeholder-graphite-600 outline-none focus-visible:ring-2 focus-visible:ring-clay"
              />
            </div>

            {error && <p className="text-sm text-[#DE5C5C]">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-clay py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? 'Setting up…' : mode === 'create' ? 'Create board' : 'Join board'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-graphite-700">
          Share the board link with teammates once it's created — that's all they need.
        </p>
      </div>
    </div>
  );
}
