import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { fetchBoardHistory } from '../utils/api';
import Toolbar from './Toolbar.jsx';
import PresenceBar from './PresenceBar.jsx';
import CursorLayer from './CursorLayer.jsx';
import ChatPanel from './ChatPanel.jsx';

function drawSegment(ctx, from, to, color, width, tool, size) {
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const fx = from.x * size.w;
  const fy = from.y * size.h;
  const tx = to.x * size.w;
  const ty = to.y * size.h;

  if (Math.abs(fx - tx) < 0.01 && Math.abs(fy - ty) < 0.01) {
    ctx.beginPath();
    ctx.arc(fx, fy, width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  ctx.restore();
}

export default function Whiteboard({ boardId, userName, password, board }) {
  const { socketRef, connected } = useSocket();

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const strokesRef = useRef([]); // finished strokes, replayed on resize/undo/clear
  const liveRef = useRef(new Map()); // in-progress strokes from OTHER users
  const drawingRef = useRef(null); // my own in-progress stroke
  const lastCursorEmitRef = useRef(0);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1C1D21');
  const [width, setWidth] = useState(6);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    const { w, h } = sizeRef.current;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
    for (const stroke of strokesRef.current) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const first = stroke.points[0];
      drawSegment(ctx, first, first, stroke.color, stroke.width, stroke.tool, { w, h });
      for (let i = 1; i < stroke.points.length; i += 1) {
        drawSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke.color, stroke.width, stroke.tool, { w, h });
      }
    }
  }, []);

  // --- Canvas sizing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = ctx;
      sizeRef.current = { w: rect.width, h: rect.height };
      redrawAll();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [redrawAll]);

  // --- Load persisted history once ---
  useEffect(() => {
    let cancelled = false;
    fetchBoardHistory(boardId)
      .then(({ strokes, messages: history }) => {
        if (cancelled) return;
        strokesRef.current = strokes.map((s) => ({
          strokeId: s.strokeId,
          points: s.points,
          color: s.color,
          width: s.width,
          tool: s.tool,
        }));
        setMessages(history);
        setHistoryLoaded(true);
        redrawAll();
      })
      .catch(() => !cancelled && setHistoryLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [boardId, redrawAll]);

  // --- Join the room (and rejoin automatically after reconnects) ---
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return undefined;

    function doJoin() {
      socket.emit('board:join', { boardId, userName, password }, (res) => {
        if (!res?.ok) {
          setJoinError(res?.error || 'Could not join this board.');
          return;
        }
        setJoinError('');
        setPresenceUsers(res.users || []);
      });
    }

    socket.on('connect', doJoin);
    if (socket.connected) doJoin();
    return () => socket.off('connect', doJoin);
  }, [socketRef, boardId, userName, password]);

  // --- Realtime listeners ---
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return undefined;

    const onDrawStart = ({ strokeId, color: c, width: w, tool: t, point }) => {
      liveRef.current.set(strokeId, { points: [point], color: c, width: w, tool: t });
      drawSegment(ctxRef.current, point, point, c, w, t, sizeRef.current);
    };

    const onDrawPoint = ({ strokeId, point }) => {
      const s = liveRef.current.get(strokeId);
      if (!s) return;
      const last = s.points[s.points.length - 1];
      s.points.push(point);
      drawSegment(ctxRef.current, last, point, s.color, s.width, s.tool, sizeRef.current);
    };

    const onDrawEnd = (payload) => {
      liveRef.current.delete(payload.strokeId);
      const exists = strokesRef.current.some((s) => s.strokeId === payload.strokeId);
      if (!exists) {
        strokesRef.current.push({
          strokeId: payload.strokeId,
          points: payload.points,
          color: payload.color,
          width: payload.width,
          tool: payload.tool,
        });
      }
    };

    const onStrokeRemoved = ({ strokeId }) => {
      strokesRef.current = strokesRef.current.filter((s) => s.strokeId !== strokeId);
      redrawAll();
    };

    const onBoardCleared = () => {
      strokesRef.current = [];
      liveRef.current.clear();
      redrawAll();
    };

    const onPresenceUpdate = (users) => setPresenceUsers(users);

    const onCursorMove = (payload) => {
      setCursors((prev) => ({ ...prev, [payload.socketId]: payload }));
    };

    const onChatMessage = (msg) => setMessages((prev) => [...prev, msg]);

    const onDisconnectCleanup = () => setCursors({});

    socket.on('draw:start', onDrawStart);
    socket.on('draw:point', onDrawPoint);
    socket.on('draw:end', onDrawEnd);
    socket.on('stroke:removed', onStrokeRemoved);
    socket.on('board:cleared', onBoardCleared);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('cursor:move', onCursorMove);
    socket.on('chat:message', onChatMessage);
    socket.on('disconnect', onDisconnectCleanup);

    return () => {
      socket.off('draw:start', onDrawStart);
      socket.off('draw:point', onDrawPoint);
      socket.off('draw:end', onDrawEnd);
      socket.off('stroke:removed', onStrokeRemoved);
      socket.off('board:cleared', onBoardCleared);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('cursor:move', onCursorMove);
      socket.off('chat:message', onChatMessage);
      socket.off('disconnect', onDisconnectCleanup);
    };
  }, [socketRef, redrawAll]);

  // --- Pointer handling ---
  function getRelativePoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    return { x, y };
  }

  function emitCursor(point) {
    const now = performance.now();
    if (now - lastCursorEmitRef.current < 40) return;
    lastCursorEmitRef.current = now;
    socketRef.current?.emit('cursor:move', { boardId, ...point });
  }

  function handlePointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvasRef.current.setPointerCapture(e.pointerId);
    const point = getRelativePoint(e);
    const strokeId = crypto.randomUUID();
    drawingRef.current = { strokeId, points: [point], color, width, tool };
    drawSegment(ctxRef.current, point, point, color, width, tool, sizeRef.current);
    socketRef.current?.emit('draw:start', { boardId, strokeId, color, width, tool, point });
  }

  function handlePointerMove(e) {
    const point = getRelativePoint(e);
    emitCursor(point);

    const drawing = drawingRef.current;
    if (!drawing) return;
    const last = drawing.points[drawing.points.length - 1];
    drawing.points.push(point);
    drawSegment(ctxRef.current, last, point, drawing.color, drawing.width, drawing.tool, sizeRef.current);
    socketRef.current?.emit('draw:point', { boardId, strokeId: drawing.strokeId, point });
  }

  function finishStroke() {
    const drawing = drawingRef.current;
    if (!drawing) return;
    drawingRef.current = null;
    strokesRef.current.push({
      strokeId: drawing.strokeId,
      points: drawing.points,
      color: drawing.color,
      width: drawing.width,
      tool: drawing.tool,
    });
    socketRef.current?.emit('draw:end', {
      boardId,
      strokeId: drawing.strokeId,
      points: drawing.points,
      color: drawing.color,
      width: drawing.width,
      tool: drawing.tool,
    });
  }

  function handleUndo() {
    socketRef.current?.emit('stroke:undo-last', { boardId });
  }

  function handleClear() {
    if (window.confirm('Clear the whole board for everyone? This cannot be undone.')) {
      socketRef.current?.emit('board:clear', { boardId });
    }
  }

  function handleSend(text) {
    socketRef.current?.emit('chat:message', { boardId, text });
  }

  async function handleShare() {
    const url = `${window.location.origin}/board/${boardId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link to invite your team:', url);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-graphite-950">
      <header className="flex items-center justify-between border-b border-graphite-800 bg-graphite-900 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay text-sm font-bold text-white">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold text-paper">{board?.name || 'Board'}</h1>
            <p className="font-mono text-[11px] text-graphite-600">{boardId}</p>
          </div>
          {!connected && (
            <span className="ml-2 rounded-full bg-graphite-800 px-2 py-0.5 text-[11px] text-graphite-600">
              Reconnecting…
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <PresenceBar users={presenceUsers} />
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg bg-graphite-800 px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-graphite-700"
          >
            {copied ? 'Link copied' : 'Share'}
          </button>
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="rounded-lg bg-graphite-800 px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-graphite-700"
          >
            Discussion
          </button>
        </div>
      </header>

      {joinError && (
        <div className="bg-[#DE5C5C]/10 px-4 py-2 text-center text-sm text-[#DE5C5C]">{joinError}</div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex items-center px-3">
          <Toolbar
            tool={tool}
            onToolChange={setTool}
            color={color}
            onColorChange={setColor}
            width={width}
            onWidthChange={setWidth}
            onUndo={handleUndo}
            onClear={handleClear}
          />
        </div>

        <div ref={containerRef} className="relative flex-1 bg-paper">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onPointerLeave={finishStroke}
          />
          <CursorLayer cursors={cursors} />
          {!historyLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/60 text-sm text-graphite-600">
              Loading board…
            </div>
          )}
        </div>

        <ChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={messages}
          onSend={handleSend}
          userName={userName}
        />
      </div>
    </div>
  );
}
