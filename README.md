# GoodVibesOnly Backend

This is the pure data storage backend for GoodVibesOnly — a GitHub-powered review app with zero backend servers.

## How It Works

1. **Frontend**: Pure HTML/JS hosted on OneCompiler or Vercel
2. **Auth**: GitHub Personal Access Token (user provides it)
3. **Storage**: JSON files saved directly to this repo via GitHub API
4. **No servers, no databases, no passwords**

## Setup Instructions

### Step 1: Create a GitHub Personal Access Token
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "GoodVibesOnly")
4. Select only the `repo` scope
5. Click "Generate token"
6. **Copy the token** (you'll only see it once)

### Step 2: Use the Frontend
1. Open the GoodVibesOnly app (on OneCompiler or Vercel)
2. Paste your token in the Sign In page
3. Click "Create Account" to set up your profile
4. Start leaving reviews!

## Repo Structure

```
goodvibes-db/
├── README.md
├── alex/
│   ├── profile.json          (username, bio)
│   └── reviews/
│       ├── 1692345678.json   (review from someone to alex)
│       └── 1692345679.json
├── sam/
│   ├── profile.json
│   └── reviews/
│       └── 1692345680.json
└── taylor/
    ├── profile.json
    └── reviews/
        └── 1692345681.json
```

## File Formats

### profile.json
```json
{
  "username": "alex",
  "bio": "Makes everyone laugh"
}
```

### reviews/TIMESTAMP.json
```json
{
  "to": "alex",
  "from": "you",
  "text": "You're amazing!",
  "date": "2023-08-15T12:34:56.789Z"
}
```

## Token Scopes Explained

The `repo` scope allows:
- ✅ Reading public repos
- ✅ Writing to your own repos
- ❌ Accessing private repos (if repo is private, token can access it)

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid or expired token | Create a new token and paste it again |
| 403 Forbidden | Token doesn't have repo scope | Regenerate token with `repo` scope |
| 404 Not Found | User folder doesn't exist | Create the account first in the app |
| CORS Error | Browser blocking API call | Make sure you're using the correct token format |

## Security Notes

- **Tokens are client-side only** — they stay in your browser (localStorage)
- **This repo must be PUBLIC** for the frontend to read it
- **Anyone with the repo URL can see all reviews**
- **Keep your token private** — it can write to the repo
- Token can be revoked anytime in GitHub Settings

## The Tech Stack

- **Frontend**: Pure HTML + Vanilla JavaScript (no frameworks)
- **Backend**: GitHub REST API (no code!)
- **Database**: This repo (version control is the database)
- **Hosting**: OneCompiler or Vercel
- **Auth**: GitHub Personal Access Token

---

**Made with ✨ by Slothscar23**
