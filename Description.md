# Slate 🎨

### Real-Time Collaborative Whiteboard

**Slate** is a real-time, multi-user collaborative whiteboard built for teams to **brainstorm, sketch, diagram, communicate, and build ideas together**.

Inspired by tools like **FigJam** and **Excalidraw**, Slate provides a shared canvas where multiple users can work simultaneously, see each other's cursors, and communicate through an integrated chat panel.

> **One canvas. Multiple minds. Real-time collaboration.**

---

## ✨ Features

* 🎨 **Interactive Whiteboard** — Draw and sketch freely on a shared canvas.
* 👥 **Multi-User Collaboration** — Multiple users can work on the same board simultaneously.
* 🖱️ **Live Cursors** — See collaborators' cursor movements in real time.
* 💬 **Team Chat** — Communicate without leaving the whiteboard.
* 💾 **Persistent Boards** — Canvas data and conversations are stored in MongoDB.
* 🔗 **Shareable Boards** — Collaborate by sharing a board link.
* ⚡ **Real-Time Synchronization** — Changes are synchronized instantly between connected users.
* 🔄 **Reconnection Support** — Reconnect to an existing session without losing persisted work.
* 📱 **Responsive Interface** — Designed to work across different screen sizes.
* 🧩 **MERN Architecture** — Built using MongoDB, Express.js, React, and Node.js.

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript / TypeScript
* HTML5 Canvas
* CSS
* WebSocket / Socket.IO

### Backend

* Node.js
* Express.js
* Socket.IO

### Database

* MongoDB
* Mongoose

### Development

* Git & GitHub
* npm
* REST APIs
* WebSockets

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │       Slate         │
                    │   Collaborative     │
                    │     Whiteboard      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼──────┐             ┌──────▼──────┐
          │   React     │             │   Socket.IO │
          │   Client    │◄───────────►│    Server   │
          └──────┬──────┘             └──────┬──────┘
                 │                           │
                 │ REST API                  │
                 │                           │
                 └─────────────┬─────────────┘
                               │
                        ┌──────▼──────┐
                        │   MongoDB   │
                        │             │
                        │ Boards      │
                        │ Drawings    │
                        │ Messages    │
                        └─────────────┘
```

---

## 📁 Project Structure

```text
slate/
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.*
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── middleware/
│   └── server.*
│
├── README.md
└── package.json
```

> The exact folder structure may vary depending on the current implementation.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/slate.git
cd slate
```

### 2. Install dependencies

Install the frontend dependencies:

```bash
cd client
npm install
```

Install the backend dependencies:

```bash
cd ../server
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

Update the values according to your environment.

---

## ▶️ Run the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local frontend URL displayed by Vite in your browser.

---

## 🔄 How Slate Works

### 1. Create a Board

A user creates or opens a Slate board.

### 2. Invite Collaborators

The board can be shared through its unique URL.

### 3. Collaborate in Real Time

Users can draw on the same canvas while Slate synchronizes changes between connected clients.

### 4. See Live Cursors

Each connected collaborator's cursor position is broadcast in real time.

### 5. Communicate

Users can use the integrated chat panel to discuss the work happening on the canvas.

### 6. Persistence

Board state and chat messages are stored in MongoDB, allowing users to return to their work later.

---

## ⚡ Real-Time Communication

Slate uses WebSockets / Socket.IO to handle real-time collaboration.

Typical events include:

```text
Client
  │
  ├── drawing:update ──────────────► Server
  │
  ├── cursor:move ────────────────► Server
  │
  └── chat:message ───────────────► Server
                                      │
                                      ▼
                                  Broadcast
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
                  User A           User B           User C
```

This allows connected users to receive updates without manually refreshing the page.

---

## 🎯 Use Cases

Slate can be used for:

* 💡 Brainstorming sessions
* 🧑‍💻 Software architecture diagrams
* 🎨 UI/UX planning
* 📊 Flowcharts
* 📚 Online teaching
* 👨‍👩‍👧‍👦 Team collaboration
* 📝 Project planning
* 🧠 Technical discussions
* 🏫 Student group projects
* 🌎 Remote collaboration

---

## 🔮 Future Roadmap

Potential improvements for future versions:

* [ ] User authentication
* [ ] Board permissions and roles
* [ ] Public/private boards
* [ ] Undo/redo history
* [ ] Text elements
* [ ] Sticky notes
* [ ] Image uploads
* [ ] Shapes and connectors
* [ ] Selection and multi-selection
* [ ] Export board as PNG/SVG/PDF
* [ ] Board version history
* [ ] Presence indicators
* [ ] Mobile/touch optimization
* [ ] Voice/video collaboration
* [ ] AI-powered brainstorming
* [ ] AI diagram generation
* [ ] Templates for common workflows

---

## 🔒 Security Considerations

For production deployment, consider implementing:

* Authentication and authorization
* Board-level access control
* Input validation
* Rate limiting
* Secure WebSocket connections
* MongoDB security rules
* Environment variable protection
* HTTPS/WSS
* Message and drawing payload validation

---

## 🌐 Deployment

Slate can be deployed using separate frontend and backend services.

### Frontend

Possible platforms:

* Vercel
* Netlify

### Backend

Possible platforms:

* Render
* Railway
* Fly.io
* AWS

### Database

* MongoDB Atlas

Make sure the production frontend URL is configured in the backend environment variables and that your WebSocket server allows the production origin.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

```bash
# Fork the repository

# Create a feature branch
git checkout -b feature/your-feature

# Commit your changes
git commit -m "feat: add your feature"

# Push the branch
git push origin feature/your-feature

# Open a Pull Request
```

---

## 📄 License

This project is available under the **MIT License**.

---

## 👨‍💻 Author

**Dishank Vora**

Built as a full-stack real-time collaboration project using the MERN ecosystem and WebSocket-based communication.

---

## ⭐ Support

If you find **Slate** interesting or useful, consider giving the repository a ⭐ on GitHub.

> **Slate — Turn ideas into something everyone can see.**
