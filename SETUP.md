# Signal — Infrastructure Setup Guide

Follow these steps to connect Signal to GitHub and Netlify.

---

## 1. Create GitHub Repository

### Option A: Using GitHub website (recommended)

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `Signal` (or `signal` — your choice)
3. **Description:** Optional, e.g. "A 9-day build"
4. Choose **Public**
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Option B: Using GitHub CLI (if you install it)

```bash
brew install gh
gh auth login
cd /Users/ben.carmichael/Documents/Signal
gh repo create Signal --public --source=. --remote=origin --push
```

---

## 2. Connect Local Project to GitHub

After creating the repo on GitHub, run:

```bash
cd /Users/ben.carmichael/Documents/Signal

# Add your new GitHub repo as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Signal.git

# Or with SSH:
# git remote add origin git@github.com:YOUR_USERNAME/Signal.git

# Push your first commit
git add .
git commit -m "Initial setup: infrastructure + journey tracker"
git branch -M main
git push -u origin main
```

---

## 3. Create Netlify Site & Connect to GitHub

1. Go to [app.netlify.com](https://app.netlify.com) and sign in (or create an account)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize Netlify if prompted
4. Select your **Signal** repository
5. **Build settings** (for static HTML for now):
   - **Build command:** leave empty (or `echo "No build"`)
   - **Publish directory:** `.` (root) or `dist` if you add a build step later
6. Click **Deploy site**

Netlify will give you a URL like `https://random-name-12345.netlify.app`. You can change it in **Site settings** → **Domain management** → **Edit site name** to something like `signal-yourname.netlify.app`.

---

## 4. Update JOURNEY.md

Once everything is live, add your URLs to `JOURNEY.md`:

- GitHub repo URL
- Netlify site URL
- Production URL (same as Netlify for now)

---

## Checklist

- [ ] GitHub repo created
- [ ] Local project pushed to GitHub
- [ ] Netlify site created and linked to repo
- [ ] First deploy successful
- [ ] JOURNEY.md updated with links
