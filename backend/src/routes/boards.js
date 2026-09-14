const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Board = require('../models/Board');
const Stroke = require('../models/Stroke');
const Message = require('../models/Message');
const { sensitiveLimiter } = require('../middleware/rateLimiters');
const { isValidBoardId, cleanText } = require('../utils/validators');

const router = express.Router();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

// POST /api/boards - create a new board, optionally password-protected
router.post('/', sensitiveLimiter, async (req, res) => {
  try {
    const name = cleanText(req.body.name, 80) || 'Untitled Board';
    const createdBy = cleanText(req.body.createdBy, 60) || 'Unknown';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const boardId = uuidv4().slice(0, 8); // short, shareable code

    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;

    const board = await Board.create({ boardId, name, createdBy, passwordHash });

    return res.status(201).json(board.toSafeJSON());
  } catch (err) {
    console.error('[boards] create error:', err.message);
    return res.status(500).json({ error: 'Could not create board.' });
  }
});

// GET /api/boards/:boardId - metadata only, never the password hash
router.get('/:boardId', async (req, res) => {
  const { boardId } = req.params;
  if (!isValidBoardId(boardId)) {
    return res.status(400).json({ error: 'Invalid board id.' });
  }

  const board = await Board.findOne({ boardId });
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }

  return res.json(board.toSafeJSON());
});

// POST /api/boards/:boardId/verify - check a password before letting the client
// attempt a socket join (sockets re-verify server-side too; this is for fast
// client-side feedback in the join form).
router.post('/:boardId/verify', sensitiveLimiter, async (req, res) => {
  const { boardId } = req.params;
  if (!isValidBoardId(boardId)) {
    return res.status(400).json({ error: 'Invalid board id.' });
  }

  const board = await Board.findOne({ boardId });
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }

  if (!board.passwordHash) {
    return res.json({ ok: true });
  }

  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const ok = await bcrypt.compare(password, board.passwordHash);
  return res.status(ok ? 200 : 401).json({ ok });
});

// GET /api/boards/:boardId/history - strokes + messages for reconnecting clients
router.get('/:boardId/history', async (req, res) => {
  const { boardId } = req.params;
  if (!isValidBoardId(boardId)) {
    return res.status(400).json({ error: 'Invalid board id.' });
  }

  const board = await Board.findOne({ boardId });
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }

  const [strokes, messages] = await Promise.all([
    Stroke.find({ boardId }).sort({ createdAt: 1 }).limit(20000).lean(),
    Message.find({ boardId }).sort({ createdAt: 1 }).limit(1000).lean(),
  ]);

  return res.json({ strokes, messages });
});

module.exports = router;
