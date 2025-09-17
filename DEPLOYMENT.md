# H2Oil Well Testing App - Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites
1. Vercel account
2. Google OAuth 2.0 credentials
3. Supabase project configured

### Step 1: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect this as a Vite project
3. Deploy the app

### Step 2: Configure Environment Variables
In your Vercel dashboard, add these environment variables:

```
VITE_APP_URL=https://your-app-name.vercel.app
```

### Step 3: Update Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 Client ID
3. Add your Vercel domain to **Authorized redirect URIs**:
   ```
   https://woywfcpcbqgeeqcinwoz.supabase.co/auth/v1/callback
   https://your-app-name.vercel.app
   ```

### Step 4: Update Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication → URL Configuration
3. Add your Vercel domain to **Site URL**:
   ```
   https://your-app-name.vercel.app
   ```
4. Add to **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   ```

## 🔧 Local Development
For local development, the app will automatically use `localhost:8081` as the redirect URL.

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_URL` | Your production app URL | `https://your-app.vercel.app` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |

## ✅ Testing OAuth
After deployment:
1. Visit your Vercel URL
2. Click "Continue with Google"
3. Complete the OAuth flow
4. You should be redirected back to your app

## 🐛 Troubleshooting
- **OAuth redirect errors**: Check that your Vercel URL is added to Google OAuth and Supabase
- **Environment variables**: Ensure `VITE_APP_URL` is set in Vercel dashboard
- **CORS issues**: Verify Supabase redirect URLs include your domain
