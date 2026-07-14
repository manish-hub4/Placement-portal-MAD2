# Placement Portal — MAD II Project

A full-stack **College Placement Portal** built with **Flask** (REST API backend) and **Vue 3** (CDN-based SPA frontend). The system supports three user roles — **Admin**, **Company**, and **Student** — and includes asynchronous background tasks, email notifications, caching, and PDF report generation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Background Tasks](#background-tasks)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)

---

## Features

### Admin
- Dashboard with placement statistics and analytics
- Manage companies, students, placement drives, and applications
- Approve / reject company and student registrations
- Trigger daily reminder emails and monthly PDF reports
- Search across all entities
- Clear Redis cache

### Company
- Register and manage company profile
- Create and manage placement drives
- View and update application statuses (Accepted / Rejected / Pending)
- Dashboard with drive and application summaries

### Student
- Register and manage student profile (CGPA, branch, skills, etc.)
- Browse and apply for eligible placement drives
- Track application statuses
- Export applications as a PDF

### System
- JWT-based authentication with access & refresh tokens
- Role-based access control (Admin / Company / Student)
- Redis-backed caching (falls back to `SimpleCache` if Redis is unavailable)
- Celery async task queue with Redis broker
- Email notifications via **MailHog** (local SMTP trap)
- Scheduled tasks with **Celery Beat**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask, Flask-RESTful, Flask-SQLAlchemy |
| Auth | Flask-Security-Too, Flask-JWT-Extended |
| Database | SQLite (development) |
| Async Tasks | Celery + Redis |
| Caching | Flask-Caching (Redis / SimpleCache) |
| Email | Flask-Mail + MailHog |
| PDF Generation | ReportLab |
| Frontend | Vue 3 (CDN), Vue Router 4, Axios |
| UI Framework | Bootstrap 5, Bootstrap Icons |

---

## Project Structure

```
placement_portal_mad2/
├── backend/
│   ├── app.py                  # Application factory & entry point
│   ├── celery_app.py           # Celery worker entry point
│   ├── config.py               # All configuration (env-overridable)
│   ├── extensions.py           # Flask-Mail & Flask-Caching instances
│   ├── requirements.txt        # Python dependencies
│   ├── db/
│   │   ├── __init__.py         # db, user_datastore exports
│   │   ├── user.py             # User model
│   │   ├── student.py          # Student profile model
│   │   ├── company.py          # Company profile model
│   │   ├── placement_drive.py  # PlacementDrive model
│   │   └── application.py      # Application model
│   ├── routes/
│   │   ├── __init__.py         # API registration
│   │   ├── auth.py             # Register, Login, Refresh, Me, Logout
│   │   ├── admin_api.py        # Admin CRUD endpoints
│   │   ├── company_api.py      # Company endpoints
│   │   ├── student_api.py      # Student endpoints
│   │   ├── dashboard_api.py    # Role-specific dashboard stats
│   │   └── celery_api.py       # Task trigger & status endpoints
│   ├── services/               # Business logic layer
│   └── tasks/
│       ├── email_tasks.py      # Async email sending
│       ├── scheduled_tasks.py  # Daily reminders & monthly reports
│       └── user_tasks.py       # User-triggered async tasks
├── frontend/
│   ├── index.html              # SPA shell
│   └── static/
│       ├── css/main.css
│       └── js/
│           ├── api.js          # Axios API client
│           ├── store.js        # Global Vue state
│           ├── router.js       # Vue Router config
│           ├── app.js          # Vue app bootstrap
│           ├── components/     # Reusable components
│           └── views/          # Role-specific views
│               ├── admin/
│               ├── company/
│               └── student/
├── DBdiagram.png               # Entity-Relationship diagram
├── MailHog.exe.exe             # Local SMTP server binary
└── requirements.txt
```

---

## Database Schema

See [`DBdiagram.png`](./DBdiagram.png) for the full ER diagram.

| Model | Key Fields |
|---|---|
| `User` | id, username, email, role, active |
| `Student` | id, user_id, name, cgpa, branch, skills, is_approved |
| `Company` | id, user_id, name, industry, is_approved |
| `PlacementDrive` | id, company_id, title, package, deadline, min_cgpa, status |
| `Application` | id, student_id, drive_id, status, applied_at |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Redis (for async tasks and caching)
- MailHog (for local email testing)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd placement_portal_mad2
```

### 2. Create & Activate Virtual Environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start Redis (required for Celery & caching)

```bash
# Windows (if Redis is installed)
redis-server

# Or via WSL / Docker
docker run -d -p 6379:6379 redis:alpine
```

> **Note:** If Redis is not running, the app automatically falls back to `SimpleCache` and runs Celery tasks in **eager mode** (synchronously).

### 5. Start MailHog (optional — for email)

```bash
# Run the included binary
./MailHog.exe.exe

# MailHog SMTP listens on  localhost:1025
# MailHog Web UI available at  http://localhost:8025
```

---

## Running the Application

### Start the Flask Development Server

```bash
cd backend
python app.py
```

The app will be available at: **http://localhost:5000**

### Start the Celery Worker (in a separate terminal)

```bash
cd backend
celery -A celery_app.celery worker --loglevel=info
```

### Start Celery Beat Scheduler (in a separate terminal)

```bash
cd backend
celery -A celery_app.celery beat --loglevel=info
```

---

## API Reference

All routes are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new user (student or company) |
| `POST` | `/api/login` | Login and receive JWT tokens |
| `POST` | `/api/refresh` | Refresh access token |
| `GET` | `/api/me` | Get current user info |
| `POST` | `/api/logout` | Logout / revoke token |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin stats overview |
| `GET/POST` | `/api/admin/companies` | List / approve companies |
| `GET/PUT/DELETE` | `/api/admin/companies/<id>` | Manage a company |
| `GET/POST` | `/api/admin/students` | List / approve students |
| `GET/PUT/DELETE` | `/api/admin/students/<id>` | Manage a student |
| `GET/POST` | `/api/admin/drives` | List / create drives |
| `GET/PUT/DELETE` | `/api/admin/drives/<id>` | Manage a drive |
| `GET` | `/api/admin/applications` | View all applications |
| `GET` | `/api/admin/analytics` | Placement analytics |
| `GET` | `/api/admin/search` | Global search |

### Company

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/company/dashboard` | Company stats |
| `GET/PUT` | `/api/company/profile` | View / update profile |
| `GET/POST` | `/api/company/drives` | List / create drives |
| `GET/PUT/DELETE` | `/api/company/drives/<id>` | Manage a drive |
| `GET` | `/api/company/drives/<id>/applications` | View applicants |
| `PUT` | `/api/company/drives/<id>/applications/<id>` | Update application status |

### Student

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student/dashboard` | Student stats |
| `GET/PUT` | `/api/student/profile` | View / update profile |
| `GET` | `/api/student/drives` | Browse eligible drives |
| `GET` | `/api/student/drives/<id>` | View drive details |
| `POST` | `/api/student/drives/<id>/apply` | Apply to a drive |
| `GET` | `/api/student/applications` | My applications |
| `GET/DELETE` | `/api/student/applications/<id>` | Application detail / withdraw |
| `GET` | `/api/student/applications/export` | Export applications as PDF |

### Celery / Background Tasks

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/tasks/reminders` | Trigger daily reminder emails |
| `POST` | `/api/admin/tasks/monthly-report` | Trigger monthly PDF report |
| `GET` | `/api/admin/tasks/status/<task_id>` | Poll task status |
| `DELETE` | `/api/admin/cache/clear` | Clear Redis cache |

---

## Background Tasks

| Task | Trigger | Description |
|---|---|---|
| **Daily Reminders** | Manual / Celery Beat | Sends email reminders to students about upcoming drive deadlines |
| **Monthly Report** | Manual / Celery Beat | Generates a PDF placement report and emails it to the admin |
| **Application Emails** | On application submit | Notifies the company of a new application |

---

## Default Credentials

On first run, an admin account is seeded automatically:

| Field | Value |
|---|---|
| Username | `admin` |
| Email | `admin@placement-portal.com` |
| Password | `Admin@123` |

> **Warning:** Change the admin password immediately in a production deployment.

---

## Environment Variables

Create a `.env` file in the `backend/` directory to override defaults:

```env
# Flask
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FLASK_DEBUG=true

# Database
DATABASE_URL=sqlite:///placement.db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Mail (MailHog defaults)
MAIL_SERVER=localhost
MAIL_PORT=1025
MAIL_DEFAULT_SENDER=noreply@placement-portal.com

# Admin seed account
ADMIN_EMAIL=admin@placement-portal.com
ADMIN_PASSWORD=Admin@123
SECURITY_PASSWORD_SALT=placement-salt
```

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file included in this repository.
