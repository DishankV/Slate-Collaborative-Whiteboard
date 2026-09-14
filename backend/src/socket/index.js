const bcrypt = require('bcryptjs');

const Board = require('../models/Board');
const Stroke = require('../models/Stroke');
const Message = require('../models/Message');
const { isValidBoardId, cleanText, isValidHexColor } = require('../utils/validators');

const CURSOR_PALETTE = [
  '#E8734A', '#3E7CB1', '#4E9F63', '#B15FBF',
  '#D4A72C', '#DE5C5C', '#4FA8A8', '#8C7AE6',
];

// boardId -> Map<socketId, { userName, color }>
const presence = new Map();

function colorForIndex(i) {
  return CURSOR_PALETTE[i % CURSOR_PALETTE.length];
}

function getRoomUsers(boardId) {
  const room = presence.get(boardId);
  if (!room) return [];
  return Array.from(room.entries()).map(([socketId, info]) => ({
    socketId,
    userName: info.userName,
    color: info.color,
  }));
}

function leaveAllBoards(io, socket) {
  for (const [boardId, room] of presence.entries()) {
    if (room.has(socket.id)) {
      room.delete(socket.id);
      io.to(boardId).emit('presence:update', getRoomUsers(boardId));
      if (room.size === 0) presence.delete(boardId);
    }
  }
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.data.boardId = null;

    socket.on('board:join', async ({ boardId, userName, password }, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};

      if (!isValidBoardId(boardId)) {
        return ack({ ok: false, error: 'Invalid board id.' });
      }

      const cleanName = cleanText(userName, 40) || 'Guest';

      try {
        const board = await Board.findOne({ boardId });
        if (!board) return ack({ ok: false, error: 'Board not found.' });

        if (board.passwordHash) {
          const match = await bcrypt.compare(typeof password === 'string' ? password : '', board.passwordHash);
          if (!match) return ack({ ok: false, error: 'Incorrect password.' });
        }

        // Leave any previous board this socket was in (e.g. switching boards)
        leaveAllBoards(io, socket);

        socket.join(boardId);
        socket.data.boardId = boardId;
        socket.data.userName = cleanName;

        if (!presence.has(boardId)) presence.set(boardId, new Map());
        const room = presence.get(boardId);
        const color = colorForIndex(room.size);
        room.set(socket.id, { userName: cleanName, color });

        board.lastActivityAt = new Date();
        await board.save();

        io.to(boardId).emit('presence:update', getRoomUsers(boardId));

        return ack({ ok: true, color, users: getRoomUsers(boardId), board: board.toSafeJSON() });
      } catch (err) {
        console.error('[socket] board:join error:', err.message);
        return ack({ ok: false, error: 'Server error joining board.' });
      }
    });

    // --- Live drawing broadcast (ephemeral, not persisted) ---
    socket.on('draw:start', (payload) => {
      const boardId = socket.data.boardId;
      if (!boardId || payload?.boardId !== boardId) return;
      socket.to(boardId).volatile.emit('draw:start', {
        strokeId: payload.strokeId,
        color: isValidHexColor(payload.color) ? payload.color : '#1c1d21',
        width: Math.min(Math.max(Number(payload.width) || 3, 1), 40),
        tool: payload.tool === 'eraser' ? 'eraser' : 'pen',
        point: payload.point,
        socketId: socket.id,
      });
    });

    socket.on('draw:point', (payload) => {
      const boardId = socket.data.boardId;
      if (!boardId || payload?.boardId !== boardId) return;
      socket.to(boardId).volatile.emit('draw:point', {
        strokeId: payload.strokeId,
        point: payload.point,
        socketId: socket.id,
      });
    });

    // --- Stroke finished: persist + broadcast authoritative copy ---
    socket.on('draw:end', async (payload) => {
      const boardId = socket.data.boardId;
      if (!boardId || payload?.boardId !== boardId) return;

      const points = Array.isArray(payload.points) ? payload.points.slice(0, 5000) : [];
      if (points.length === 0) return;

      const stroke = {
        boardId,
        strokeId: String(payload.strokeId || '').slice(0, 60),
        authorSocketId: socket.id,
        userName: socket.data.userName || 'Guest',
        color: isValidHexColor(payload.color) ? payload.color : '#1c1d21',
        width: Math.min(Math.max(Number(payload.width) || 3, 1), 40),
        tool: payload.tool === 'eraser' ? 'eraser' : 'pen',
        points: points.map((p) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 })),
      };

      try {
        const saved = await Stroke.create(stroke);
        io.to(boardId).emit('draw:end', {
          strokeId: saved.strokeId,
          _id: saved._id,
          color: saved.color,
          width: saved.width,
          tool: saved.tool,
          points: saved.points,
          userName: saved.userName,
          socketId: socket.id,
        });
      } catch (err) {
        console.error('[socket] draw:end persist error:', err.message);
      }
    });

    socket.on('stroke:undo-last', async ({ boardId }) => {
      if (!boardId || boardId !== socket.data.boardId) return;
      try {
        const last = await Stroke.findOne({ boardId, authorSocketId: socket.id }).sort({ createdAt: -1 });
        if (!last) return;
        await Stroke.deleteOne({ _id: last._id });
        io.to(boardId).emit('stroke:removed', { strokeId: last.strokeId });
      } catch (err) {
        console.error('[socket] stroke:undo-last error:', err.message);
      }
    });

    socket.on('board:clear', async ({ boardId }) => {
      if (!boardId || boardId !== socket.data.boardId) return;
      try {
        await Stroke.deleteMany({ boardId });
        io.to(boardId).emit('board:cleared');
      } catch (err) {
        console.error('[socket] board:clear error:', err.message);
      }
    });

    socket.on('cursor:move', (payload) => {
      const boardId = socket.data.boardId;
      if (!boardId || payload?.boardId !== boardId) return;
      const room = presence.get(boardId);
      const info = room?.get(socket.id);
      if (!info) return;
      socket.to(boardId).volatile.emit('cursor:move', {
        socketId: socket.id,
        userName: info.userName,
        color: info.color,
        x: Number(payload.x) || 0,
        y: Number(payload.y) || 0,
      });
    });

    socket.on('chat:message', async ({ boardId, text }) => {
      if (!boardId || boardId !== socket.data.boardId) return;
      const clean = cleanText(text, 2000);
      if (!clean) return;

      try {
        const message = await Message.create({
          boardId,
          userName: socket.data.userName || 'Guest',
          text: clean,
        });
        io.to(boardId).emit('chat:message', {
          _id: message._id,
          userName: message.userName,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('[socket] chat:message error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      leaveAllBoards(io, socket);
    });
  });
}

module.exports = registerSocketHandlers;
