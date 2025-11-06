# ClaraVerse Web Deployment Guide

This guide explains how to deploy ClaraVerse as a web application on platforms like Netlify, Vercel, or any static hosting service.

## Overview

ClaraVerse is built as an Electron desktop application, but it can also run as a standalone web application. When running in web mode, features that require Electron APIs (like Docker management, local file system access, and desktop integrations) will gracefully show notifications prompting users to download the full desktop app.

## What Works in Web Mode

✅ **Core Features:**
- AI Chat Interface (Clara Assistant)
- Agent Studio (create and manage agents)
- Agent Runner (run agent workflows)
- Community Features
- Task Management
- Notebook Interface
- Image Gallery
- Help & Documentation
- Settings (most features)

⚠️ **Limited or Desktop-Only Features:**
- Docker Container Management → Desktop app required
- Local Model Management → Desktop app required
- LlamaSwap Service → Desktop app required
- ComfyUI Integration → Desktop app required
- MCP Service → Desktop app required
- File System Access → Desktop app required
- Screen Sharing → Desktop app required
- System Diagnostics → Desktop app required
- Auto Updates → Desktop app only
- Background Services → Desktop app only

## Building for Web

### 1. Build the Web Application

```bash
# Install dependencies
npm install

# Build for web deployment
npm run build:web

# Preview the build locally
npm run preview:web
```

The build output will be in the `dist/` directory.

### 2. Deployment on Netlify

#### Option A: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

#### Option B: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command:** `npm run build:web`
   - **Publish directory:** `dist`
5. Click "Deploy site"

#### Netlify Configuration

The build automatically creates a `_headers` file for proper CORS configuration:

```
/*
  Cross-Origin-Embedder-Policy: credentialless
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
```

### 3. Deployment on Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Deploy via Vercel Dashboard

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
5. Click "Deploy"

#### Vercel Configuration

The build automatically creates a `vercel.json` file with proper headers.

### 4. Deployment on Other Platforms

The `dist/` folder contains a static website that can be deployed to:

- **GitHub Pages**
- **Cloudflare Pages**
- **Firebase Hosting**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**
- **Any static hosting service**

## Environment Configuration

### Production Environment Variables

You may want to set these environment variables in your hosting platform:

```bash
# Optional: Custom API endpoints
VITE_API_ENDPOINT=https://your-api.com

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id
```

### Build Optimization

The build is already optimized with:
- Code splitting (React, vendor, PDF.js chunks)
- Minification
- Tree shaking
- Asset optimization

## User Experience in Web Mode

### Banner Notification

Users will see a dismissible banner at the top of the page:

> ℹ️ **You're using the web version.** Some features like Docker management, local AI models, and system integration require the desktop app. [Get Desktop App]

### Feature Notifications

When users try to use desktop-only features, they'll see toast notifications:

> 💻 **Desktop App Required**
>
> The "Docker Management" feature requires the desktop app for full functionality.
>
> [Download Desktop App]

These notifications:
- Automatically dismiss after 10 seconds
- Can be manually dismissed
- Don't show repeatedly for the same feature
- Link to the GitHub releases page

## Technical Details

### Architecture

The web compatibility is achieved through:

1. **Environment Detection** (`src/utils/electronEnvironment.ts`)
   - Detects if running in Electron or web browser
   - Provides feature availability checks

2. **Mock APIs** (`src/utils/electronMocks.ts`)
   - Provides fallback implementations for Electron APIs
   - Gracefully handles missing features
   - Triggers user notifications for desktop-only features

3. **Promotion Components** (`src/components/DesktopAppPromotion.tsx`)
   - Shows banner for web users
   - Displays toast notifications for unavailable features
   - Links to desktop app downloads

### Initialization Flow

```
main.tsx
  └─> Check if Electron
      ├─> Yes: Run normally with Electron APIs
      └─> No: Initialize mock APIs
          └─> App.tsx
              ├─> Show WebModeBanner
              ├─> Show DesktopAppPromotion (toasts)
              └─> Render app with graceful fallbacks
```

### Code Examples

#### Checking Environment

```typescript
import { isElectron, featureAvailability } from './utils/electronEnvironment';

if (isElectron()) {
  // Use Electron-specific features
} else {
  // Show web-friendly alternative
}

// Check specific features
if (featureAvailability.isDockerAvailable()) {
  // Enable Docker UI
}
```

#### Safe Electron API Calls

```typescript
import { safeElectronCall } from './utils/electronEnvironment';

// Will show desktop prompt if not in Electron
const version = await safeElectronCall('electron.getAppVersion', '0.0.0-web');
```

## Troubleshooting

### Issue: CORS Errors

**Solution:** Ensure the hosting platform respects the `_headers` or `vercel.json` configuration. Some platforms may require manual header configuration.

### Issue: Features Not Working

**Solution:** Check the browser console for errors. Most desktop-only features will gracefully degrade and show notifications.

### Issue: Build Fails

**Solution:**
1. Clear node_modules and reinstall: `npm run clean:install`
2. Clear build cache: `rm -rf dist`
3. Rebuild: `npm run build:web`

### Issue: Large Bundle Size

**Solution:** The build is already optimized, but you can:
1. Audit dependencies: `npm run build -- --analyze`
2. Remove unused dependencies
3. Use dynamic imports for large components

## Performance Optimization

### Recommended Netlify/Vercel Settings

- **Node version:** 18.x or higher
- **Build optimization:** Enable (automatic)
- **Asset optimization:** Enable (automatic)
- **CDN:** Enable (automatic)
- **HTTP/2:** Enable (automatic)

### Caching Strategy

The build generates files with content hashes for optimal caching:

```
index.html (no cache)
assets/[name].[hash].js (long cache)
assets/[name].[hash].css (long cache)
```

## Support

For issues with:
- **Desktop features:** Download the desktop app from [GitHub Releases](https://github.com/badboysm890/ClaraVerse/releases)
- **Web deployment:** Check this documentation and hosting platform docs
- **Bugs:** Report at [GitHub Issues](https://github.com/badboysm890/ClaraVerse/issues)

## License

Same as the main ClaraVerse project license.
