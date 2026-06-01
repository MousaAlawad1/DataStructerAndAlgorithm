# Vercel Deployment Guide

## Configuration Files

This directory contains the necessary configuration files for Vercel deployment:

### 1. `vercel.json`
- Configures Vercel to treat this as a static build
- Sets up SPA routing (all routes serve `index.html`)
- Enables clean URLs

### 2. `.vercel/project.json`
- Explicitly sets Vite as the framework
- Defines build, dev, and install commands
- Specifies the output directory (`dist`)

### 3. `vite.config.ts` (updated)
- Added `base: process.env.BASE_URL || './'` for proper asset paths
- Structured build output for better caching

## Environment Variables

For Vercel deployment, set these environment variables in your project settings:

- `BASE_URL` (optional): Base path for assets (default: `./`)
  - Use `/` for root domain deployment
  - Use `/your-project-name/` for subdirectory deployment

## Deployment Steps

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   git push origin master
   ```

2. **Import project in Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel should auto-detect the Vite framework

3. **Configure environment variables** (optional):
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add `BASE_URL` if deploying to a subdirectory

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Expected Behavior

- All routes should work (e.g., `/`, `/about`, etc.)
- Static assets (CSS, JS, images) should load correctly
- No 404 errors on page refresh
- Proper client-side navigation

## Troubleshooting

If links still don't work:

1. **Check build output**:
   ```bash
   npm run build
   ls dist/
   ```
   Should see `index.html` and `assets/` folder.

2. **Verify `vercel.json` routes**:
   Make sure the `routes` array includes:
   ```json
   {
     "src": "/(.*)",
     "dest": "/index.html"
   }
   ```

3. **Check Vercel logs**:
   - Go to your deployment in Vercel
   - Click "View Functions" or "Build Logs"
   - Look for any errors

4. **Clear Vercel cache**:
   - redeploy with "Clear Cache and Redeploy" option

## Notes

- The `vite-plugin-singlefile` plugin bundles everything into a single HTML file, which is optimal for simple deployments.
- If you need server-side rendering or advanced routing, consider using Next.js instead.
- All external links (GitHub, Instagram, Telegram) use absolute URLs and should work regardless of deployment location.