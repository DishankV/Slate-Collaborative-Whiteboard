const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function createBoard({ name, createdBy, password }) {
  const res = await fetch(`${SERVER_URL}/api/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, createdBy, password }),
  });
  return handle(res);
}

export async function fetchBoard(boardId) {
  const res = await fetch(`${SERVER_URL}/api/boards/${boardId}`);
  return handle(res);
}

export async function verifyBoardPassword(boardId, password) {
  const res = await fetch(`${SERVER_URL}/api/boards/${boardId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return handle(res);
}

export async function fetchBoardHistory(boardId) {
  const res = await fetch(`${SERVER_URL}/api/boards/${boardId}/history`);
  return handle(res);
}

export { SERVER_URL };
