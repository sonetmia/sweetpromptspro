# SweetPrompts Pro - Vercel & GitHub Deployment Guide

SweetPrompts Pro is configured with **Dual-Mode Execution (Full-Stack + Static Client Fallback)**.
It will work seamlessly when pushed to GitHub and deployed on **Vercel** or **GitHub Pages**.

---

## Option 1: Deploy to Vercel (Recommended - 2 Minutes)

### Step 1: Push Code to GitHub
1. Create a new repository on GitHub (e.g., `sweetprompts-pro`).
2. Run the following commands in your local project terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SweetPrompts Pro"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sweetprompts-pro.git
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository (`sweetprompts-pro`).
4. Framework Preset: **Vite** (Automatically detected).
5. (Optional) Add Environment Variables:
   - `GEMINI_API_KEY`: `AIzaSy...` (Your default Google Gemini API Key)
   - `GROQ_API_KEY`: `gsk_...` (Optional)
   - `OPENROUTER_API_KEY`: `sk-or-...` (Optional)
   - `MISTRAL_API_KEY`: `...` (Optional)
6. Click **Deploy**.

---

## How It Works Under The Hood
1. **Vercel Routing (`vercel.json`):**  
   All `/api/*` endpoints (`/api/generate`, `/api/vision`, `/api/test-connection`) are automatically deployed as Vercel Serverless Functions in `/api/`.
2. **Automatic Browser Fallback:**  
   If any API endpoint is unreachable or deployed on purely static hosting (like GitHub Pages), the app seamlessly executes AI calls directly from the browser using the API key entered in the **Settings** menu.
3. **No "Failed to Fetch" Errors:**  
   The application gracefully handles network shifts and API key validation.

---

## Option 2: Deploy to GitHub Pages (Pure Static)

1. Add `"homepage": "https://YOUR_USERNAME.github.io/sweetprompts-pro"` to `package.json`.
2. Install `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
3. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run `npm run deploy`. Users can simply add their API key in Settings!
