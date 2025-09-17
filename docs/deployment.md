# H2Oil Well Testing Calculator - Deployment Guide

## 🚀 **Deployment Overview**

This guide provides comprehensive instructions for deploying the H2Oil Well Testing Calculator to various platforms, with detailed configuration steps for production environments.

## 📋 **Prerequisites**

### **Required Accounts**
- [Vercel Account](https://vercel.com) (Recommended)
- [GitHub Account](https://github.com)
- [Supabase Account](https://supabase.com)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth)

### **Required Tools**
- Node.js 18+ installed locally
- Git installed and configured
- Modern web browser

## 🌐 **Platform-Specific Deployment**

### **Vercel Deployment (Recommended)**

#### **Step 1: Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### **Step 2: Connect to Vercel**
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository: `loloil123/welltest-calculator`
4. Vercel will auto-detect Vite configuration

#### **Step 3: Configure Environment Variables**
In Vercel Dashboard → Project Settings → Environment Variables:

```env
VITE_APP_URL=https://your-app-name.vercel.app
VITE_SUPABASE_URL=https://woywfcpcbqgeeqcinwoz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **Step 4: Deploy**
1. Click **"Deploy"**
2. Wait for build completion
3. Access your app at the provided URL

### **Netlify Deployment**

#### **Step 1: Build Configuration**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **Step 2: Deploy to Netlify**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### **Self-Hosted Deployment**

#### **Step 1: Build for Production**
```bash
npm run build
```

#### **Step 2: Serve Static Files**
```bash
# Using serve
npm install -g serve
serve -s dist -l 3000

# Using nginx
# Copy dist/ contents to nginx web root
# Configure nginx for SPA routing
```

## 🔧 **Environment Configuration**

### **Development Environment**
```env
VITE_APP_URL=http://localhost:8081
NODE_ENV=development
```

### **Production Environment**
```env
VITE_APP_URL=https://your-domain.com
NODE_ENV=production
```

### **Staging Environment**
```env
VITE_APP_URL=https://staging.your-domain.com
NODE_ENV=production
```

## 🔐 **Authentication Setup**

### **Google OAuth Configuration**

#### **Step 1: Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials

#### **Step 2: Configure OAuth Client**
- **Application Type**: Web application
- **Authorized Redirect URIs**:
  ```
  https://woywfcpcbqgeeqcinwoz.supabase.co/auth/v1/callback
  https://your-app-name.vercel.app
  http://localhost:8081 (for development)
  ```

#### **Step 3: Supabase Configuration**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Client ID and Client Secret
4. Set redirect URL: `https://woywfcpcbqgeeqcinwoz.supabase.co/auth/v1/callback`

### **Supabase Configuration**

#### **Step 1: URL Configuration**
In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-app-name.vercel.app`
- **Redirect URLs**:
  ```
  https://your-app-name.vercel.app/**
  http://localhost:8081/**
  ```

#### **Step 2: Email Templates**
Customize email templates for:
- Email confirmation
- Password reset
- Magic link authentication

## 🗄️ **Database Setup**

### **Supabase Database Schema**
The application uses the following tables:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_units JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculation sessions table
CREATE TABLE calculation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Row Level Security (RLS)**
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Calculation sessions policies
CREATE POLICY "Users can view own sessions" ON calculation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON calculation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON calculation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON calculation_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔒 **Security Configuration**

### **CORS Settings**
Configure CORS in Supabase Dashboard → Settings → API:

```json
{
  "allowed_origins": [
    "https://your-app-name.vercel.app",
    "http://localhost:8081"
  ]
}
```

### **Rate Limiting**
Configure rate limiting for API endpoints:
- Authentication: 5 requests per minute
- Calculations: 100 requests per minute
- Data export: 10 requests per minute

### **Environment Variables Security**
- Never commit `.env` files to version control
- Use Vercel/Netlify environment variable management
- Rotate API keys regularly
- Use different keys for development/staging/production

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**
1. Enable Vercel Analytics in dashboard
2. Monitor performance metrics
3. Track user engagement
4. Monitor error rates

### **Supabase Monitoring**
1. Monitor database performance
2. Track authentication metrics
3. Monitor API usage
4. Set up alerts for errors

### **Custom Monitoring**
```javascript
// Add to main.tsx for error tracking
window.addEventListener('error', (event) => {
  console.error('Application Error:', event.error);
  // Send to monitoring service
});
```

## 🚀 **Performance Optimization**

### **Build Optimization**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist/assets/*.js

# Optimize images
npm install -D @vitejs/plugin-legacy
```

### **CDN Configuration**
- Enable Vercel CDN
- Configure cache headers
- Optimize static assets
- Enable gzip compression

### **Database Optimization**
- Create appropriate indexes
- Optimize queries
- Monitor query performance
- Use connection pooling

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Authentication Issues**
- Verify OAuth redirect URLs
- Check Supabase configuration
- Validate environment variables
- Test in incognito mode

#### **Database Connection Issues**
- Verify Supabase URL and keys
- Check RLS policies
- Monitor database logs
- Test API endpoints

### **Debug Mode**
```bash
# Enable debug logging
VITE_DEBUG=true npm run dev

# Check network requests
# Open browser dev tools → Network tab
```

## 📞 **Support & Maintenance**

### **Regular Maintenance**
- Update dependencies monthly
- Monitor security advisories
- Backup database regularly
- Review and rotate API keys

### **Monitoring Checklist**
- [ ] Application uptime
- [ ] Database performance
- [ ] Authentication success rate
- [ ] Error rates and logs
- [ ] User engagement metrics

### **Emergency Procedures**
1. **Service Outage**: Check Vercel status page
2. **Database Issues**: Contact Supabase support
3. **Authentication Problems**: Verify OAuth configuration
4. **Performance Issues**: Check Vercel analytics

---

## 📚 **Additional Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

**Need Help?** Create an issue in the [GitHub repository](https://github.com/loloil123/welltest-calculator/issues) or contact the development team.
