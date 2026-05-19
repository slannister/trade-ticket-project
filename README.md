# TikSwap - 票券交易交流站

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-3.1-orange.svg)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight marketplace for ticket trading and collectibles, supporting both fixed-price listings and barter-style exchanges. Built with Flask and vanilla JavaScript.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-language** | One-click switching between Traditional Chinese and English |
| **Real-time Chat** | Built-in messaging between buyers and sellers |
| **Read Status** | Unread message tracking with visual indicators |
| **Favorites** | Save interesting listings for later |
| **Listing Management** | Full CRUD with status updates (active/sold/closed) |
| **Dark/Light Theme** | System-wide theme toggle |
| **Responsive Design** | Works on desktop and tablet |

---

## Tech Stack

### Backend
- **Framework**: Flask 3.0
- **ORM**: Flask-SQLAlchemy 3.1
- **Authentication**: Flask-JWT-Extended 4.6 + Bcrypt
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **API Style**: RESTful JSON

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS Variables** - Custom properties for theming
- **ES Modules** - Organized in API / Modules / Utils / i18n layers

---

## Project Structure

```
trade-ticket-project/
├── run.py                     # Application entry point
├── config.py                  # Environment configuration
├── requirements.txt           # Python dependencies
│
├── src/                       # Backend source
│   ├── extensions.py          # Flask extensions (db, jwt, bcrypt)
│   ├── models.py              # SQLAlchemy models
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth_service.py    # Authentication
│   │   ├── listing_service.py # Listing management
│   │   ├── inquiry_service.py # Messaging
│   │   └── favorite_service.py # Favorites
│   │
│   ├── routes/                # Route controllers
│   │   ├── auth.py
│   │   ├── listings.py
│   │   ├── inquiries.py
│   │   ├── favorites.py
│   │   └── upload.py
│   │
│   └── utils/                 # Utilities
│       ├── responses.py        # Standardized API responses
│       └── validators.py      # Input validation
│
├── static/                    # Frontend assets
│   ├── css/
│   │   └── styles.css         # Global styles
│   └── js/
│       ├── app.js             # Homepage entry
│       ├── detail.js          # Detail page entry
│       ├── api/               # API clients
│       │   ├── client.js      # Fetch wrapper
│       │   ├── auth.js
│       │   ├── listings.js
│       │   └── inquiries.js
│       ├── modules/           # Feature modules
│       │   ├── auth.js        # Auth state management
│       │   ├── chat.js        # Chat panel
│       │   ├── listings.js    # Listing operations
│       │   ├── favorites.js  # Favorites management
│       │   ├── messages.js   # Message list
│       │   ├── filters.js    # Search filters
│       │   └── pagination.js # Pagination
│       ├── i18n/              # Internationalization
│       │   ├── index.js
│       │   ├── en.js
│       │   └── zh-TW.js
│       └── utils/             # Utilities
│           ├── date.js
│           ├── dom.js
│           ├── storage.js
│           └── toast.js
│
├── templates/                 # Jinja2 templates
│   ├── index.html
│   ├── detail.html
│   ├── profile.html
│   └── reset_password.html
│
├── instance/                  # Database directory
│   └── tikswap.db
│
└── uploads/                   # Uploaded files
    └── listings/
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Routes    │ ──▶ │  Services   │ ──▶ │   Models    │
│ (Controller)│     │   (Logic)   │     │     (M)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  HTTP Request      Business Logic       SQLAlchemy
    Response        & Validation           Models
```

---

## API Reference

### Authentication `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Create account | - |
| POST | `/login` | Sign in | - |
| POST | `/logout` | Sign out | JWT |
| GET | `/me` | Get current user | JWT |
| PUT | `/profile` | Update profile | JWT |
| POST | `/password/reset` | Request reset | - |
| POST | `/password/update` | Change password | JWT |

### Listings `/api/listings`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all (paginated) | - |
| POST | `/` | Create listing | JWT |
| GET | `/mine` | My listings | JWT |
| GET | `/favorites` | Favorited listings | JWT |
| GET | `/<id>` | Get by ID | - |
| PUT | `/<id>` | Update listing | JWT |
| PUT | `/<id>/status` | Update status | JWT |
| DELETE | `/<id>` | Delete listing | JWT |

### Inquiries `/api/inquiries`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | All conversations | JWT |
| POST | `/` | Send inquiry | - |
| POST | `/<id>/reply` | Reply to thread | JWT |
| GET | `/<id>/replies` | Get replies | JWT |
| GET | `/unread-count` | Unread count | JWT |
| PUT | `/<id>/read` | Mark as read | JWT |

### Favorites `/api/favorites`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List favorites | JWT |
| POST | `/<listing_id>` | Add to favorites | JWT |
| DELETE | `/<listing_id>` | Remove | JWT |

---

## Getting Started

### Prerequisites

- Python 3.7+

### Installation

```bash
# Clone the repository
git clone https://github.com/slannister/trade-ticket-project.git
cd trade-ticket-project

# Install dependencies
pip install -r requirements.txt

# Run the application
python run.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `dev-secret-key` |
| `JWT_SECRET_KEY` | JWT signing key | `jwt-dev-secret` |
| `DATABASE_URL` | Database connection | `sqlite:///instance/tikswap.db` |
| `UPLOAD_FOLDER` | Upload directory | `uploads` |

---

## License

This project is for educational purposes.

---

## TODO

- [ ] Production deployment with PostgreSQL
- [ ] Email notifications (verification, password reset)
- [ ] Push notifications
- [ ] Mobile optimization
- [ ] Additional language support