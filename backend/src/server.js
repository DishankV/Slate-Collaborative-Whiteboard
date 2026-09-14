require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const boardsRouter = require('./routes/boards');
const registerSocketHandlers = require('./socket/index');
const { apiLimiter } = require('./middleware/rateLimiters');

const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (curl, health checks) with no origin header
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

const app = express();
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/boards', apiLimiter, boardsRouter);

// Fallback error handler (e.g. CORS rejection thrown above)
app.use((err, req, res, next) => {
  console.error('[http] error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 2e6, // 2MB cap on any single socket payload
});

registerSocketHandlers(io);

async function start() {
  await connectDB();
  server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on port ${PORT}`);
});
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
