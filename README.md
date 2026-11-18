# 🏏 Cricket Auction Pro

> **The Ultimate Real-Time Cricket Player Auction Management System**  
> Designed for premier cricket tournaments, featuring a single-administrator command center and a high-impact, read-only live broadcast interface for TVs and 1080p projectors.

---

## 🌟 Highlights & Key Features

- **Master Admin Control**: Only ONE authenticated administrator can log in, place bids, modify data, and control the auction. Public registration is permanently disabled.
- **Dual Interfaces**:
  1. **Private Admin Dashboard**: Full control over players, dynamic categories, franchises, purse budgets, bidding increments, hotkeys, audit logs, and unsold rounds.
  2. **Public Read-Only Live Display (`/live`)**: Ultra-modern sports broadcast theme tailored for 1920×1080 projectors, showing high-resolution player photos, giant live bid counters, holding franchise crests, and zero private admin controls or balance details.
- **Fast Keyboard Shortcut Bidding**: Admin can assign keyboard keys (e.g., `Q`, `W`, `E`, `R`, `T`) to franchises. Tapping a hotkey validates purse limits and submits an incremented bid in milliseconds, instantly reflected on the live TV screen.
- **Strict Financial Business Rules**:
  - Automatically validates that bids never fall below player base price.
  - Strictly prevents franchise balances from dropping below zero.
  - Automatically deducts the hammer price from the winning franchise purse upon **SOLD**.
  - **Never** deducts funds on **UNSOLD** marks.
- **Unsold Round Workflow**: Allows the auctioneer to seamlessly re-auction unsold players in Round 2 / Round 3 without duplicating player records.
- **Instant Synchronization via Socket.IO**: Server-driven single source of truth with real-time room segregation.
- **Celebration Confetti & Effects**: Cinematic animations and confetti explosions on confirmed sales.
- **Export & Audit Trail**: Full transaction history downloadable as CSV or Excel (`.xlsx`).

---

## 🏗️ Architecture & Tech Stack

```text
Frontend: React.js (Vite), Tailwind CSS v4, Lucide React, SweetAlert2, Canvas Confetti
Backend:  Node.js, Express.js
Real-time: Socket.IO
Database: MongoDB (Mongoose) with zero-config embedded Mongo fallback for instant local testing
Auth:     JWT (JSON Web Token) with Bcrypt password hashing
Uploads:  Cloudinary integration with seamless local disk fallback
Export:   SheetJS (xlsx) for CSV & Excel generation
```

---

## 📂 Project Structure

```text
cricket-auction-pro/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection & Cloudinary setup
│   │   ├── controllers/     # Auth, Auction, Player, Team, Category, Settings
│   │   ├── middleware/      # Admin JWT auth, Multer file upload
│   │   ├── models/          # Admin, Player, Team, Category, AuctionState, Transaction, Settings
│   │   ├── routes/          # Express REST API routes
│   │   ├── sockets/         # Socket.IO rooms & event broadcasting
│   │   ├── utils/           # Database seed script & public state sanitization
│   │   └── server.js        # Express HTTP & Socket.IO server entrypoint
│   ├── uploads/             # Local upload storage directory
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor
│   │   ├── components/      # Common (Sidebar, Navbar, Modals) & Auction celebrations
│   │   ├── context/         # Auth, Socket.IO, and Localization/Settings providers
│   │   ├── pages/
│   │   │   ├── admin/       # Login, Dashboard, Auction Control, Players, Teams, Categories, History, Settings
│   │   │   └── public/      # Live TV / Projector Display (/live)
│   │   ├── App.jsx          # Route definitions & protected admin wrappers
│   │   ├── index.css        # Tailwind styling & broadcast glow effects
│   │   └── main.jsx
│   ├── vite.config.js       # Vite proxy configuration
│   └── package.json
├── package.json             # Root workspace runner scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24.x)
- **npm**: v9.0.0 or higher
- **MongoDB**: (Optional) A local or MongoDB Atlas instance. If not detected, the system will automatically spin up an embedded in-memory MongoDB instance for instant testing!

### 2. Installation

Clone or navigate to the project directory:
```bash
cd cricket-auction-pro
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### 3. Environment Configuration

Copy `.env.example` in `backend/`:
```bash
cd ../backend
cp .env.example .env
```

Contents of `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cricket_auction_pro
JWT_SECRET=cricket-auction-pro-super-secret-key-2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Cloudinary (Optional – leave blank to use built-in local file storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Running the Application

You can run the backend and frontend in separate terminals:

**Terminal 1 (Backend API & Sockets):**
```bash
cd backend
npm run dev
```
*The server will start on `http://localhost:5000` and automatically seed default categories, franchises (Mumbai, Chennai, Bangalore, Delhi, Kolkata) with hotkeys `Q, W, E, R, T`, 8 star players, and master admin credentials.*

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```
*Vite will launch on `http://localhost:5173`.*

---

## 🔐 Admin Authentication & Credentials

| Credential | Value |
|---|---|
| **Admin Login URL** | `http://localhost:5173/admin/login` |
| **Default Username** | `admin` |
| **Default Password** | `admin123` |
| **Projector URL** | `http://localhost:5173/live` |

> *Admin password can be updated anytime inside `Settings ➔ Master Administrator Password`.*

---

## ⌨️ Team Keyboard Shortcut Bidding System

During active bidding inside **Auction Control (`/admin/auction`)**:
- Tap <kbd>Q</kbd> ➔ Place bid for **Mumbai Strikers**
- Tap <kbd>W</kbd> ➔ Place bid for **Chennai Warriors**
- Tap <kbd>E</kbd> ➔ Place bid for **Bangalore Blasters**
- Tap <kbd>R</kbd> ➔ Place bid for **Delhi Daredevils**
- Tap <kbd>T</kbd> ➔ Place bid for **Kolkata Kings**

*Hotkeys automatically disable while typing in inputs or search bars to prevent accidental bids.*

---

## 📺 Public Live Auction Display (`/live`)

Designed for TV screens and 1080p/4K venue projectors:
- **Zero Sensitive Data**: Team purse balances, admin buttons, and private stats are stripped server-side.
- **Large Format Visuals**: Prominent player photograph, serial number, playing style, base price, and real-time highest bid counter.
- **Sound & Confetti**: Full confetti burst and celebration banner upon player being marked **SOLD**.

---

## 📊 Auction History & Reporting

Navigate to **Auction History (`/admin/history`)** to:
- Filter transactions by Franchise, Category, Round, or Status (SOLD / UNSOLD).
- Export complete reports in **CSV** or **Microsoft Excel (.xlsx)** format.

---

## 🛠️ Production Deployment Guide

### Option 1: Full-Stack on Render / Railway
1. Push this repository to GitHub.
2. In Render or Railway, create a **Web Service** pointing to the `backend/` folder.
3. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, etc.).
4. In `frontend/`, run `npm run build` and deploy the `dist/` directory to Vercel, Netlify, or serve statically from Express.

### Option 2: Docker
Create a Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN cd backend && npm install --production
RUN cd frontend && npm install && npm run build
EXPOSE 5000
CMD ["node", "backend/src/server.js"]
```

---

## 📜 License
MIT License. Built for professional cricket leagues, tournament organizers, and sports club managers.
