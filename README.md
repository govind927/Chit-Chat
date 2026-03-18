# 💬 Chit-Chat

A production-ready real-time group chat application built with the MERN stack and Socket.io.

## ✨ Features

### Messaging
- Real-time messaging with Socket.io
- Typing indicators ("User is typing…")
- Read receipts (✓ sent · ✓✓ delivered · ✓✓ seen)
- Edit and delete messages
- Reply to specific messages
- Emoji reactions on messages
- @mention users with autocomplete
- Media sharing — images, videos, and files (up to 10MB)
- Full message history with pagination

### Rooms
- Create group chat rooms with a unique 8-character invite code
- Join rooms instantly via room ID
- Admin roles — kick users, dismiss rooms
- Participant list with online status
- Room list panel with last message preview and unread badge

### Notifications
- Real-time toast notifications for new messages
- Unread message count badges per room
- Browser push notifications
- Sound alerts

### UI & UX
- Dark and light theme toggle with persistence
- Fully responsive — mobile-first layout
- Emoji picker with 5 categories
- Drag-and-drop file upload with preview
- Sticky navbar with online status indicator
- Settings page — avatar upload, bio, notification preferences

### Security
- JWT authentication with 7-day expiry
- Socket.io auth middleware — token verified once on connection
- Rate limiting on auth routes (10 req / 15 min)
- Timing-attack-safe login (bcrypt always runs)
- Helmet HTTP security headers
- Input validation on all routes
- Soft deletes — data preserved on room/message removal

---

## 🗂 Project Structure

```
chit-chat/
├── server/                       # Express + Socket.io backend
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js # JWT verification
│   │   │   └── uploadMiddleware.js # Multer file uploads
│   │   ├── models/
│   │   │   ├── User.js           # User schema
│   │   │   ├── Room.js           # Room schema
│   │   │   └── Message.js        # Message schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # Register, login, logout
│   │   │   ├── roomRoutes.js     # Create, join, leave, dismiss
│   │   │   ├── messageRoutes.js  # Edit, delete, react, upload
│   │   │   └── userRoutes.js     # Profile, avatar, search
│   │   ├── socket/index.js       # All Socket.io event handlers
│   │   ├── utils/generateRoomId.js
│   │   └── server.js             # App entry point
│   ├── uploads/                  # Uploaded media files
│   ├── .env.example
│   └── package.json
│
└── client/                       # React + Vite frontend
    ├── src/
    │   ├── api/axiosClient.js    # Axios with interceptors
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── SocketContext.jsx
    │   │   ├── ThemeContext.jsx
    │   │   └── NotificationContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── AuthForm.jsx
    │   │   ├── ChatRoom.jsx
    │   │   ├── MessageBubble.jsx
    │   │   ├── RoomSidebar.jsx
    │   │   ├── ChatListPanel.jsx
    │   │   ├── EmojiPicker.jsx
    │   │   ├── FileUpload.jsx
    │   │   ├── MentionInput.jsx
    │   │   └── NotificationToast.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── LobbyPage.jsx
    │   │   ├── ChatPage.jsx
    │   │   └── SettingsPage.jsx
    │   ├── styles/
    │   │   ├── globals.css
    │   │   └── themes.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/chit-chat.git
cd chit-chat
```

### 2. Configure the backend

```bash
cd server
npm install
cp .env.example .env
mkdir -p uploads
```

Edit `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chit-chat
JWT_SECRET=your_super_secret_key_at_least_32_characters
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Configure the frontend

```bash
cd ../client
npm install
```

### 4. Run in development

Open two terminals:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

The app will open at **http://localhost:3000**

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| POST | `/api/auth/logout` | Sign out, set offline | Yes |

### Rooms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rooms/create` | Create a room | Yes |
| POST | `/api/rooms/join` | Join a room by ID | Yes |
| POST | `/api/rooms/leave` | Leave a room | Yes |
| POST | `/api/rooms/dismiss` | Delete a room (admin) | Yes |
| GET | `/api/rooms/my-rooms` | List joined rooms | Yes |
| GET | `/api/rooms/:roomId/messages` | Paginated message history | Yes |

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages/upload` | Upload a file/image | Yes |
| PUT | `/api/messages/:id` | Edit a message | Yes |
| DELETE | `/api/messages/:id` | Delete a message | Yes |
| POST | `/api/messages/:id/react` | Toggle emoji reaction | Yes |
| POST | `/api/messages/:id/read` | Mark as read | Yes |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user | Yes |
| PUT | `/api/users/me` | Update profile | Yes |
| POST | `/api/users/me/avatar` | Upload avatar | Yes |
| GET | `/api/users/search?q=` | Search users | Yes |
| GET | `/api/users/:userId` | Get user by ID | Yes |

---

## ⚡ Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId }` | Join a room |
| `chatMessage` | `{ roomId, text, replyTo? }` | Send a message |
| `mediaMessage` | `{ roomId, url, name, type }` | Send a media message |
| `typing` | `{ roomId }` | Start typing indicator |
| `stop-typing` | `{ roomId }` | Stop typing indicator |
| `edit-message` | `{ roomId, messageId, text }` | Edit a message |
| `delete-message` | `{ roomId, messageId }` | Delete a message |
| `react-message` | `{ roomId, messageId, emoji }` | Toggle reaction |
| `read-message` | `{ roomId, messageId }` | Mark as read |
| `kick-user` | `{ roomId, targetSocketId }` | Kick a user (admin) |
| `dismiss-room` | `{ roomId }` | Dismiss a room (admin) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ users, isAdmin }` | Joined successfully |
| `room-update` | `{ users }` | Participant list changed |
| `room-dismissed` | — | Room was closed |
| `chatMessage` | message object | New message |
| `systemMessage` | `{ text, timestamp }` | System notification |
| `typing` | `{ username }` | User started typing |
| `stop-typing` | `{ username }` | User stopped typing |
| `message-edited` | `{ messageId, text }` | Message was edited |
| `message-deleted` | `{ messageId }` | Message was deleted |
| `message-reaction` | `{ messageId, reactions }` | Reactions updated |
| `message-read` | `{ messageId, userId }` | Message was read |
| `kicked` | — | You were kicked |
| `mentioned` | `{ roomId, messageId, by }` | You were @mentioned |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite 7 |
| Real-time | Socket.io 4.8 |
| Backend | Node.js 18, Express 4 |
| Database | MongoDB 8, Mongoose 8 |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| File uploads | Multer |
| Security | Helmet, express-rate-limit |
| HTTP client | Axios |

---

## 🌍 Deployment

### Environment variables for production

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<your_production_mongodb_uri>
JWT_SECRET=<strong_random_secret>
CLIENT_ORIGIN=https://your-frontend-domain.com
```

### Build the frontend

```bash
cd client && npm run build
# Output: client/dist/
```

### Serve static files from Express (optional)

Add to `server.js` before your routes:

```js
import path from "path";
app.use(express.static(path.join(process.cwd(), "../client/dist")));
app.get("*", (_, res) =>
  res.sendFile(path.join(process.cwd(), "../client/dist/index.html"))
);
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> Built with ❤️ using the MERN stack + Socket.io