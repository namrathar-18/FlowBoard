# FlowBoard — Project & Task Management Platform

A full-stack task management application built with **Node.js**, **React**, **MongoDB Atlas**, and a **GitHub Actions CI/CD pipeline**.

> **DevOps Lab 2** — CI workflow triggered by commits using GitHub Actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Testing | Jest + Supertest (backend), Vitest (frontend) |
| CI/CD | GitHub Actions |

---

## Features

- 🔐 **Authentication** — Register & login with JWT tokens
- 📋 **Projects** — Create, update, delete projects with colors & status
- ✅ **Tasks** — Full CRUD with status (Todo/In Progress/Review/Done), priority levels, due dates
- 📊 **Dashboard** — Workspace overview with stats, progress bars, task breakdown
- 🗂️ **Board View** — Kanban-style task board view
- 🔔 **Toast Notifications** — Instant feedback on every action

---

## Project Structure

```
Lab2/
├── .github/
│   └── workflows/
│       └── ci.yml          ← GitHub Actions pipeline
├── backend/
│   ├── src/
│   │   ├── models/         ← User, Project, Task schemas
│   │   ├── routes/         ← auth, projects, tasks routers
│   │   ├── middleware/     ← JWT auth middleware
│   │   └── app.js          ← Express entry point
│   ├── tests/              ← Jest + Supertest API tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            ← Axios client
│   │   ├── components/     ← Sidebar, etc.
│   │   ├── context/        ← Auth + Toast providers
│   │   ├── pages/          ← Dashboard, Projects, Tasks, Login, Register
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Backend Setup

```bash
cd backend
npm install
# Copy .env.example to .env and fill in values
cp .env.example .env
npm run dev
```

Backend runs at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mpubqxe.mongodb.net/flowboard
JWT_SECRET=your_secret_here
PORT=5000
NODE_ENV=development
```

---

## Running Tests

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main` and `develop`.

### Pipeline Jobs

```
push/PR ──► Lint ──► Backend Tests ──► Build ──► Security
                  └──► Frontend Tests ──┘
                                         └──► CI Summary
```

| Job | Description |
|---|---|
| **Lint** | Checks Node.js syntax for all source files |
| **Backend Tests** | Runs Jest + Supertest against MongoDB Atlas |
| **Frontend Tests** | Runs Vitest smoke tests |
| **Build** | Vite production build with artifact upload |
| **Security** | npm audit + secret scan |
| **Summary** | Reports all job results in one place |

### GitHub Secrets Required

Add these in **Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string for JWT signing |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project (cascades tasks) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/summary` | Dashboard stats |

---

## License
MIT
