# 💬 Chatlify

**Chatlify** is a premium, real-time messaging application designed to make chatting easy, enhanced, and enjoyable. It brings speed, security, and visual excellence together to uplift your everyday conversations.

---

## ⚡ Features

### 🔑 Authentication & Security
- **Flexible & Case-Insensitive Sign In**: Access your workspace using either your registered email address or your username (handled case-insensitively).
- **Secure Password Recovery**: Request reset links sent directly to your registered email address via Nodemailer (SMTP).
- **Glassmorphic Reset Form**: A secure page to create and verify a new password via temporary tokenized JWT validation.
- **Active Session Auditing**: View active device logins. Logouts securely revoke active database sessions instantly, while browser-persistent identifiers prevent duplicate entries.

### 💬 Real-Time Conversations
- **Instant Messaging**: Synchronized, low-latency messaging powered by Socket.io.
- **Visual Design**: Message bubbles with a modern blue-to-violet linear gradient for sent messages and a deep slate-dark background for received messages.
- **Clean Avatars**: Avatars appear only on received messages for a clean, space-efficient workspace layout.
- **Replying & Metadata**: Easily view context tags with direct sender names, and absolute placement of delivery indicators (timestamps and read receipts).

### 🔍 Interactive Navigation
- **Keyboard Shortcuts**: Press `Cmd + K` (or `Ctrl + K`) to immediately focus the user search input.
- **Dynamic Search**: Instant suggestion pop-ups with an inline clear/reset cross button when typing.
- **Connect Requests**: Manage relationships with interactive connect/cancel action sheets.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS & Vanilla CSS
- **Network**: Axios, Socket.io-client
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js, TypeScript, Express
- **Database**: MongoDB (via Mongoose ODM)
- **Real-Time Communication**: Socket.io
- **Mailer**: Nodemailer (SMTP transport)
- **Encryption**: Bcrypt (hashing), JSON Web Tokens (JWT)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas URI)

### Installation & Setup

1. **Clone the repository and enter the project directory:**
   ```bash
   cd chat-app
   ```

2. **Configure Backend Environment:**
   Navigate to the `backend` folder and create a `.env` file:
   ```bash
   cd backend
   ```
   Create a `.env` file with the following variables:
   ```env
   PORT=8080
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret_key
   BCRYPT_SALT=10

   # Cloudinary Media Configuration (if applicable)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret

   # SMTP Mail Server Configuration (For password recovery)
   SMTP_HOST=your_smtp_host (e.g. smtp.gmail.com)
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ```

3. **Install Dependencies and Start Services:**

   **For Backend:**
   ```bash
   npm install
   npm run dev
   ```
   *The server runs on [http://localhost:8080](http://localhost:8080).*

   **For Frontend:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The client app runs on [http://localhost:5173](http://localhost:5173).*

---

## 📂 Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Request handlers (auth, sessions, messages)
│   │   ├── models/        # Mongoose database schemas (User, Message, Session)
│   │   ├── routes/        # Express API endpoints routing
│   │   ├── utils/         # Mailer and helper tools
│   │   └── server.ts      # Application entrypoint & socket integration
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable widgets (ChatWindow, Sidebar, Suggestion lists)
│   │   ├── pages/         # Screen layouts (Login, Signup, ChatLayout, ResetPassword)
│   │   ├── services/      # Axios API routing and socket bindings
│   │   ├── store/         # Zustand authentication and session states
│   │   └── index.css      # Core styles & custom gradients
│   └── vite.config.ts
└── README.md
```

---

## 🔒 Security Best Practices
- **NoSQL Sanitization**: All database query parameters are parsed and sanitized using native string conversion blocks to prevent script injection.
- **Private Reset Tokens**: JWT reset tokens are generated with short-lived expiration spans and are only accessible through secure email payloads.
