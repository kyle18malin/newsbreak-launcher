# NewsBreak Ad Launcher

A powerful web application for managing and launching advertising campaigns across multiple NewsBreak ad accounts.

![Dashboard Preview](https://via.placeholder.com/800x400?text=NewsBreak+Ad+Launcher)

## Features

- 🚀 **Bulk Campaign Launch** - Create campaigns across multiple ad accounts simultaneously
- 🏢 **Organization Management** - Group accounts by client, brand, or team
- 🔑 **Multi-Token Support** - Manage multiple API access tokens
- 📋 **Campaign Templates** - Save and reuse campaign configurations
- 📊 **Launch History** - Track all campaign launches and their results
- 🎨 **Modern UI** - Beautiful, responsive interface built with React & Tailwind

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/newsbreak-launcher)

Or deploy manually:

1. Fork this repository
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Railway will auto-detect and deploy

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (proxies API to backend)

### Build for Production

```bash
cd frontend
npm run build
# Built files go to frontend/dist/
# The backend will serve these automatically
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 8000) | No |
| `DATABASE_URL` | Database connection string (default: SQLite) | No |

For production with PostgreSQL on Railway:
```
DATABASE_URL=postgresql://user:pass@host:port/db
```

## API Documentation

The backend exposes a REST API for all operations:

### Organizations
- `GET /api/organizations` - List all organizations
- `POST /api/organizations` - Create organization
- `DELETE /api/organizations/{id}` - Delete organization

### Access Tokens
- `GET /api/tokens` - List all tokens
- `POST /api/tokens` - Add new token
- `POST /api/tokens/{id}/refresh-accounts` - Refresh accounts for token
- `DELETE /api/tokens/{id}` - Delete token

### Ad Accounts
- `GET /api/accounts` - List all cached accounts
- `GET /api/accounts/{id}/campaigns` - Get campaigns
- `GET /api/accounts/{id}/adsets` - Get ad sets
- `GET /api/accounts/{id}/ads` - Get ads

### Campaign Management
- `POST /api/accounts/{id}/campaigns` - Create campaign
- `POST /api/accounts/{id}/adsets` - Create ad set
- `POST /api/accounts/{id}/ads` - Create ad

### Bulk Operations
- `POST /api/bulk-launch` - Launch campaign to multiple accounts

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/{id}` - Delete template

### History
- `GET /api/history` - Get launch history

### Stats
- `GET /api/stats` - Get dashboard statistics

## Project Structure

```
newsbreak-launcher/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # SQLAlchemy models
│   ├── newsbreak_client.py  # NewsBreak API wrapper
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # React application
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── railway.json             # Railway deployment config
├── nixpacks.toml            # Build configuration
└── README.md
```

## Getting Your NewsBreak API Token

1. Log in to your [NewsBreak Business Portal](https://business.newsbreak.com)
2. Navigate to Settings → API Access
3. Generate a new access token
4. Copy the token and add it to the launcher

## Support

For issues with this launcher, please open a GitHub issue.

For NewsBreak API questions, contact NewsBreak support or refer to their [API documentation](https://advertising-api.newsbreak.com).

## License

MIT License - feel free to use and modify for your needs.
