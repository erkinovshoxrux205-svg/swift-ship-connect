# 🚀 Asloguz - Deployment Guide

## 📋 Prerequisites

- Node.js 18+ 
- Vercel account
- Firebase project configured
- Supabase project configured

## 🔧 Firebase Configuration

### 1. Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`asialog-2aa38`)
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   - `your-app-name.vercel.app`
   - `localhost` (for development)
   - `localhost:8082` (if using different port)

### 2. Environment Variables

Add these to your Vercel project settings:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBuht58TZusVJm4do47LSooBWBGSZErsS8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=asialog-2aa38.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=asialog-2aa38
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=asialog-2aa38.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=472239170057
NEXT_PUBLIC_FIREBASE_APP_ID=1:472239170057:web:c5267f425f2ab661520ed8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VZWR0QP89W

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic3VyZW5hbWVzIiwiYSI6ImNta3UxenZjajF2aDUzY3NhZXNqY3JjeXkifQ.lBzScNO-wcVp0gFnExQx-w
```

## 🌐 Vercel Deployment

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect it's a React/Vite project
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview locally
npm run preview
```

## 🎯 Production Checklist

### ✅ Before Deploying

- [ ] Firebase domains are configured
- [ ] All environment variables are set in Vercel
- [ ] Supabase migrations are applied
- [ ] Test authentication flow
- [ ] Test map functionality
- [ ] Test document generation

### ✅ After Deploying

- [ ] Test user registration
- [ ] Test email verification
- [ ] Test login/logout
- [ ] Test order creation
- [ ] Test navigation features
- [ ] Test responsive design

## 🔍 Debugging Common Issues

### Email Verification Errors

**Error**: `Firebase: Domain not allowlisted by project (auth/unauthorized-continue-uri)`

**Solution**: Add your Vercel domain to Firebase authorized domains

### Map Loading Issues

**Error**: Map tiles not loading

**Solution**: Check Mapbox token and ensure it's properly configured

### Authentication Issues

**Error**: `useAuth must be used within an AuthProvider`

**Solution**: Ensure Firebase context is properly wrapped

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile devices:

- PWA ready
- Touch-friendly interface
- Optimized for slow connections
- Works offline with cached data

## 🌍 Multi-language Support

Supported languages:
- Русский (Russian)
- O'zbek (Uzbek)
- English

Language automatically detects from browser settings.

## 💳 Currency Support

Default currency: Uzbekistan Sum (UZS)
- Automatic formatting for UZS
- No decimal places for sums
- Proper locale formatting

## 🔐 Security Features

- Firebase Authentication with email verification
- Role-based access control
- Protected routes
- Secure API endpoints
- Input validation and sanitization

## 📊 Performance Optimization

- Lazy loading components
- Code splitting
- Optimized images
- Cached API responses
- Service worker for offline support

## 🚀 Performance Metrics

Target performance goals:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## 📞 Support

For deployment issues:
- Email: support@asloguz.com
- Documentation: Check inline comments
- GitHub: Create issue in repository

---

**Asloguz Logistics** - Professional Logistics Platform for Central Asia
© 2024 Asloguz. All rights reserved.
