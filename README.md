# Blood Donor Match

A web-based Blood Donor Matching and Management System.

Verified hospitals and voluntary blood donors meet in one place:

- **Donors** register, keep their profile up to date, find verified hospitals, ask to donate, answer hospital requests, confirm appointments and see their donation history.
- **Hospital managers** register their hospital, review donor requests, schedule donations, send requests to compatible donors, and record completed donations.
- **The system admin** verifies hospitals, manages users and monitors activity.

Built with **Django + Django REST Framework** (backend), **React + Tailwind CSS** (frontend) and **SQLite** (database).

---

## Contents

1. [What you need to install first](#1-what-you-need-to-install-first)
2. [Set up the backend (Django)](#2-set-up-the-backend-django)
3. [Set up the frontend (React)](#3-set-up-the-frontend-react)
4. [Demo accounts](#4-demo-accounts)
5. [Try the full workflow](#5-try-the-full-workflow)
6. [How the project is organised](#6-how-the-project-is-organised)
7. [API endpoints](#7-api-endpoints)
8. [Common problems](#8-common-problems)
9. [Things you might want to change](#9-things-you-might-want-to-change)

---

## 1. What you need to install first

| Tool | Version | Check it with |
|------|---------|---------------|
| Python | 3.10 or newer | `python --version` |
| Node.js | 18 or newer (includes npm) | `node --version` |

Download Python from python.org (on Windows, tick **"Add Python to PATH"** during installation) and Node.js (LTS) from nodejs.org.

You will use **two terminal windows**: one for the backend and one for the frontend. Both must be running at the same time.

> On macOS/Linux, if `python` does not work, use `python3` instead.

---

## 2. Set up the backend (Django)

Open a terminal in the project folder, then:

```bash
cd backend
```

**Step 1 - Create a virtual environment** (a private box for this project's Python packages):

```bash
python -m venv venv
```

**Step 2 - Turn it on:**

```bash
# Windows (Command Prompt or PowerShell)
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

You should now see `(venv)` at the start of the terminal line. Turn it on every time you open a new terminal for the backend.

**Step 3 - Install the packages:**

```bash
pip install -r requirements.txt
```

**Step 4 - Create the database** (SQLite, saved as `backend/db.sqlite3`):

```bash
python manage.py makemigrations
python manage.py migrate
```

`makemigrations` turns the models into migration files; `migrate` creates the tables.

**Step 5 - Add demo data** (admin, hospitals and donors so you can try it immediately):

```bash
python manage.py seed_demo
```

**Step 6 - Start the server:**

```bash
python manage.py runserver
```

The API is now running at **http://127.0.0.1:8000/api/**. Leave this terminal open.

Optional: Django's built-in admin site is at http://127.0.0.1:8000/admin/ (log in with `admin@demo.com` / `password123`). It lets you see and edit every table directly, which is useful for checking the database during your defence.

---

## 3. Set up the frontend (React)

Open a **second** terminal in the project folder:

```bash
cd frontend
npm install
npm run dev
```

`npm install` downloads the packages (only needed the first time). `npm run dev` starts the app.

Open **http://localhost:5173** in your browser.

---

## 4. Demo accounts

All demo passwords are **`password123`**.

| Role | Email | Notes |
|------|-------|-------|
| System admin | admin@demo.com | |
| Hospital manager | manager@demo.com | City General Hospital, already verified |
| Hospital manager | manager2@demo.com | Unity Specialist Hospital, waiting for verification |
| Donor | amina@demo.com | O+, never donated, eligible |
| Donor | musa@demo.com | O-, last donated 120 days ago, eligible |
| Donor | fatima@demo.com | A+, donated 30 days ago, **not eligible yet** |
| Donor | yusuf@demo.com | B+, eligible |
| Donor | zainab@demo.com | AB+, eligible |

You can also create new accounts from the **Create an account** page. To create another admin, run `python manage.py createsuperuser`.

---

## 5. Try the full workflow

Tip: use a normal window for one user and a private/incognito window for another, so you can be logged in as two people at once.

**A. Verify a hospital (admin)**
1. Log in as `admin@demo.com`.
2. Go to **Verify hospitals**. Unity Specialist Hospital is pending. Click **Verify hospital** (or **Reject** with a reason).

**B. Donor asks to donate (donor-initiated request)**
1. Log in as `amina@demo.com` and open **Find a hospital**.
2. Click **Request to donate** on City General Hospital, pick a date, and click **Send request**.
3. Log in as `manager@demo.com`, open **Donation requests**, and click **Approve**.
4. Click **Schedule donation**, choose a date and time, add instructions, and save.
5. Back as Amina, open **My requests** and click **Confirm appointment** (or **Ask for another time**).
6. As the manager, click **Mark as completed** and enter the quantity.
7. Amina's **Donation history** now shows the donation, and her dashboard shows her next eligible date (90 days later).

**C. Hospital asks donors (hospital-initiated request with matching)**
1. As `manager@demo.com`, open **Request donors**.
2. Choose blood group **O+**, an urgency level and a date, then **Send request**. The system finds donors whose blood group is compatible, who are available and who are eligible (Fatima is skipped because she donated 30 days ago).
3. Log in as `musa@demo.com`, open **My requests**, and click **Accept**.
4. The manager then schedules it, and the flow continues as in B.

Every step sends an in-app notification to the other person (see **Notifications** in the menu).

---

## 6. How the project is organised

```
blood-donor-match/
├── backend/                     Django REST API
│   ├── manage.py                Command-line tool (runserver, migrate...)
│   ├── requirements.txt         Python packages
│   ├── config/
│   │   ├── settings.py          All settings (SQLite, JWT, CORS, 90-day rule)
│   │   └── urls.py              Connects each app's URLs under /api/
│   ├── accounts/                Users, roles, register, login (with lockout)
│   │   ├── models.py            User model (logs in with email)
│   │   ├── permissions.py       IsDonor, IsHospitalManager, IsAdminRole
│   │   └── management/commands/seed_demo.py   Demo data
│   ├── donors/                  Donor profile, availability, eligibility
│   ├── hospitals/               Hospital registration and verification
│   ├── donations/               Donation requests, appointments, matching
│   │   ├── matching.py          Blood compatibility + eligibility rules
│   │   └── views.py             The whole request -> schedule -> complete flow
│   ├── records/                 Donation history
│   └── notifications/           In-app notifications
│
└── frontend/                    React app (Vite + Tailwind CSS)
    ├── package.json             JavaScript packages
    ├── tailwind.config.js       Colours and font
    └── src/
        ├── main.jsx             Starting point
        ├── App.jsx              All page routes (URLs)
        ├── api/client.js        Axios setup (adds the login token)
        ├── context/AuthContext.jsx   Who is logged in
        ├── components/          Layout (sidebar), buttons, inputs, badges
        ├── utils/format.js      Dates, blood groups, error messages
        └── pages/
            ├── Login.jsx, Register.jsx, Notifications.jsx, History.jsx
            ├── donor/           Dashboard, Find a hospital, My requests, Profile
            ├── hospital/        Dashboard, Donation requests, Request donors
            └── admin/           Dashboard, Verify hospitals, Users, All requests
```

**Every backend app follows the same pattern**, so once you understand one you understand them all:

| File | What it does |
|------|--------------|
| `models.py` | The database tables |
| `serializers.py` | Turns table rows into JSON and checks incoming data |
| `views.py` | The endpoints: receive a request, do the work, return a response |
| `urls.py` | Which URL calls which view |
| `admin.py` | Shows the tables on Django's admin site |

**How a click travels through the system** (example: donor clicks "Send request"):

1. `pages/donor/BrowseHospitals.jsx` calls `api.post('/donations/requests/', ...)`.
2. `api/client.js` adds the login token and sends it to Django.
3. `config/urls.py` → `donations/urls.py` → `submit_request` in `donations/views.py`.
4. The view checks the hospital is verified and the donor is eligible, saves a `DonationRequest`, and notifies the hospital manager.
5. The JSON response comes back and the page shows a success message.

**Link to Chapter Three of the report:**

| Chapter 3 design | Where it is in the code |
|------------------|-------------------------|
| Use cases (Figure 3.4) | Pages in `frontend/src/pages/` and views in each backend app |
| State diagram (Figure 3.6) | `DonationRequest.Status` in `donations/models.py` |
| Class diagram (Figure 3.7) | Models in each `models.py`; `MatchingService` is `donations/matching.py` |
| Package diagram (Figure 3.8) | The `backend/` apps and `frontend/src/` folders above |
| ER diagram (Figure 3.9) | `User`, `DonorProfile`, `Hospital`, `DonationRequest`, `Appointment`, `DonationHistory`, `Notification` |
| Compatibility table (Table 3.10) | `COMPATIBLE_DONORS` in `donations/matching.py` |

---

## 7. API endpoints

All endpoints start with `http://127.0.0.1:8000/api/`. Except register and login, they need the header `Authorization: Bearer <access token>` (the frontend adds it automatically). You can test them with Postman.

| Method | URL | Who | What it does |
|--------|-----|-----|--------------|
| POST | `auth/register/` | anyone | Create an account (donor or hospital manager) |
| POST | `auth/login/` | anyone | Log in, returns a token |
| GET/PATCH | `auth/me/` | logged in | See or update your name and phone |
| GET | `auth/users/` | admin | List users (`?role=donor`) |
| POST | `auth/users/<id>/toggle-active/` | admin | Activate or deactivate a user |
| GET/PATCH | `donors/me/` | donor | See or update your donor profile |
| GET | `hospitals/` | logged in | Verified hospitals (`?search=kano`) |
| POST | `hospitals/register/` | manager | Register your hospital |
| GET/PATCH | `hospitals/mine/` | manager | See or update your hospital |
| GET | `hospitals/admin/` | admin | All hospitals (`?status=pending`) |
| POST | `hospitals/<id>/verify/` | admin | `{"action": "verify"}` or `{"action": "reject", "reason": "..."}` |
| POST | `donations/requests/` | donor | Ask to donate at a hospital |
| GET | `donations/requests/mine/` | donor | Your requests |
| POST | `donations/requests/<id>/respond/` | donor | `{"accept": true}` to a hospital's request |
| POST | `donations/requests/<id>/confirm/` | donor | Confirm the appointment |
| POST | `donations/requests/<id>/reschedule/` | donor | `{"note": "..."}` ask for another time |
| GET | `donations/requests/hospital/` | manager | Requests for your hospital |
| POST | `donations/requests/send/` | manager | Send a request to compatible donors |
| POST | `donations/requests/<id>/review/` | manager | `{"approve": true}` or `false` with a reason |
| POST | `donations/requests/<id>/schedule/` | manager | Set date, time, instructions |
| POST | `donations/requests/<id>/complete/` | manager | Record the completed donation |
| POST | `donations/requests/<id>/cancel/` | manager | Cancel (e.g. donor did not attend) |
| GET | `donations/admin/requests/` | admin | All requests |
| GET | `donations/admin/stats/` | admin | Dashboard numbers |
| GET | `records/mine/` | donor, manager | Donation history |
| GET | `notifications/` | logged in | Your notifications |
| POST | `notifications/<id>/read/` | logged in | Mark one as read |
| POST | `notifications/read-all/` | logged in | Mark all as read |

---

## 8. Common problems

**"Cannot reach the server. Make sure the backend is running."**
The Django terminal is not running. Go to `backend`, activate the virtual environment, and run `python manage.py runserver`.

**`no such table: ...`**
You skipped the database step. Run `python manage.py makemigrations` and then `python manage.py migrate`.

**PowerShell says running scripts is disabled (when activating venv)**
Run this once in PowerShell, then try again:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
Or use Command Prompt instead of PowerShell.

**`'python' is not recognized`** (Windows)
Reinstall Python and tick "Add Python to PATH", or try `py` instead of `python`.

**`npm` is not recognized**
Install Node.js from nodejs.org, then close and reopen the terminal.

**I want to start again with a clean database**
Stop the server, delete `backend/db.sqlite3`, then run `python manage.py migrate` and `python manage.py seed_demo` again.

**"Too many failed attempts"**
After 5 wrong passwords an account is locked for 15 minutes. Wait, or reset the database.

**The frontend runs on a different port or the API is on another address**
Copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`. If the frontend port changes, add it to `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py`.

---

## 9. Things you might want to change

| What | Where |
|------|-------|
| Days between donations (90) | `DONATION_INTERVAL_DAYS` in `backend/config/settings.py` |
| Login attempts before lockout (5) and lock time (15 min) | `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_MINUTES` in the same file |
| Blood compatibility rules | `COMPATIBLE_DONORS` in `backend/donations/matching.py` (and the copy in `frontend/src/utils/format.js`) |
| Colours and font | `frontend/tailwind.config.js` |
| Menu items | `MENUS` in `frontend/src/components/Layout.jsx` |
| Demo data | `backend/accounts/management/commands/seed_demo.py` |

Before deploying online, change `SECRET_KEY`, set `DEBUG = False`, and add your domain to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in `settings.py`.
