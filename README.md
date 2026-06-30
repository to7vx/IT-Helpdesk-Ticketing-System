# IT Helpdesk Ticketing System

A full-stack web application for IT support teams to manage and resolve end-user tickets, with SLA tracking, real-time metrics, and role-based access control.

## Live Demo Credentials

| Role  | Email                     | Password     |
|-------|---------------------------|--------------|
| Admin | admin@helpdesk.local      | Admin1234!   |
| Agent | agent@helpdesk.local      | Agent1234!   |
| User  | user@helpdesk.local       | User1234!    |

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS      |
| Charts      | Recharts                            |
| Backend     | FastAPI (Python 3.11+)              |
| ORM         | SQLAlchemy 2.0                      |
| Database    | PostgreSQL                          |
| Auth        | JWT (python-jose + bcrypt)          |
| Deployment  | Render / Railway / VPS              |

## Features

- **3 roles:** End User, Agent, Admin — each with distinct permissions
- **Full ticket lifecycle:** Open → In Progress → Resolved → Closed (+ reopen)
- **SLA tracking:** Automatic due-date calculation per priority; tickets flagged At Risk / Overdue
- **Activity log:** Every status change, assignment, and reply timestamped on each ticket
- **Internal notes:** Agent-only notes hidden from end users
- **Analytics dashboard:** Ticket volume trends, SLA compliance rate, avg resolution time
- **Agent performance:** Per-agent resolved count, open load, avg resolution hours
- **Notifications:** In-app notifications on assignment, status change, reply, SLA breach
- **Seed script:** 300 realistic tickets spread over 90 days so dashboards show real data

## Pages (17 total)

| # | Page | Role |
|---|------|------|
| 1 | Login | Public |
| 2 | Register | Public |
| 3 | Forgot Password | Public |
| 4 | My Tickets Dashboard | End User |
| 5 | Submit Ticket | End User |
| 6 | Ticket Detail (user view) | End User |
| 7 | Ticket Queue | Agent |
| 8 | Ticket Detail (agent view) | Agent |
| 9 | Agent Dashboard | Agent |
| 10 | Admin Analytics Dashboard | Admin |
| 11 | Agent Performance | Admin |
| 12 | User Management | Admin |
| 13 | Category Management | Admin |
| 14 | SLA Rules | Admin |
| 15 | Notifications | All |
| 16 | Profile / Settings | All |
| 17 | 404 Not Found | All |

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# 4. Start the API (tables created automatically on startup)
uvicorn app.main:app --reload --port 8000

# 5. (Optional) Seed demo data
python seed.py
```

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` — no CORS config needed during development.

## API Documentation

FastAPI auto-generates interactive docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
IT Helpdesk Ticketing System/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + CORS + router registration
│   │   ├── config.py         # Settings (DATABASE_URL, SECRET_KEY, etc.)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── api/              # Route handlers
│   │   └── core/             # Security + auth dependencies
│   ├── seed.py               # Demo data generator
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx            # Router + protected routes
    │   ├── api/               # Axios client
    │   ├── context/           # Auth context
    │   ├── components/        # Shared UI components
    │   └── pages/             # Auth / User / Agent / Admin / Shared
    ├── tailwind.config.js
    └── vite.config.js
```

## Deployment (Render)

**Backend (Web Service)**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment vars: `DATABASE_URL`, `SECRET_KEY`

**Frontend (Static Site)**
- Build: `npm run build`
- Publish directory: `dist`
- Add rewrite rule: `/* → /index.html` (for SPA routing)
- Set `VITE_API_BASE_URL` env var to your backend URL and update `vite.config.js`

**Database**
- Create a PostgreSQL instance on Render/Railway
- Copy the connection string to `DATABASE_URL`
- Tables are created automatically on first backend startup
- Run `python seed.py` once to populate demo data
