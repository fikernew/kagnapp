# 🚀 Production Deployment Guide: ቃኝ (Kagn)

This project is a modern React 19 + TypeScript + Vite application optimized for zero-config global edge deployment on **Vercel** and **Netlify**.

---

## 📦 Build Scripts

The following scripts are defined in `package.json`:

| Script | Command | Purpose |
|---|---|---|
| `npm run build` | `vite build` | Standard production build (outputs to `/dist`) |
| `npm run build:prod` | `tsc --noEmit && vite build` | Type-checked strict production build |
| `npm run typecheck` | `tsc --noEmit` | Validates TypeScript types without emitting code |
| `npm run preview` | `vite preview` | Locally preview the production `/dist` build |
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Starts the local development server |

---

## ⚡ 1. Deploying to Vercel

The repository includes a ready-to-use `vercel.json` with Single-Page Application (SPA) rewrite rules and immutable cache headers.

### Option A: Via Vercel Web Dashboard (Git Push)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/new), click **"Add New Project"** and import your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to your account
vercel login

# Deploy directly from terminal
vercel

# Deploy to production domain
vercel --prod
```

---

## 🌐 2. Deploying to Netlify

The repository includes `netlify.toml` and `public/_redirects` for automatic SPA route handling and security headers.

### Option A: Via Netlify Dashboard (Git Push)
1. In the [Netlify Dashboard](https://app.netlify.com/), click **"Add new site"** &rarr; **"Import an existing project"**.
2. Connect your Git repository.
3. Netlify will automatically detect the settings from `netlify.toml`:
   - **Base directory**: `/`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy Site**.

### Option B: Via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and link site
netlify init

# Build and deploy to production
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔒 3. Security & Production Checklist

1. **SPA Rewrites**:
   - `vercel.json` provides `{ "source": "/(.*)", "destination": "/index.html" }`
   - `netlify.toml` provides `/* -> /index.html (200)`
   - Ensures refreshing on sub-paths (`/admin`, `/scan`, etc.) does not return 404s.

2. **Caching Headers**:
   - Static bundles in `/assets/*` are marked as `public, max-age=31536000, immutable`.
   - HTML documents are revalidated immediately on new deployments.

3. **Safe-Area Insets**:
   - Configured in `index.html` with `viewport-fit=cover` and CSS env variables for modern smartphones and iOS home bars.
