# Deployment Guide - AI Insights

This guide covers deploying nManthan with AI-powered insights to production.

## 🚀 Deployment Platforms

### Vercel (Recommended)
- **Free tier**: Yes
- **Setup**: Automatic from GitHub
- **Environment variables**: Easy to configure

### Netlify
- **Free tier**: Yes
- **Setup**: Automatic from GitHub
- **Environment variables**: Easy to configure

### Other Platforms
Any platform that supports environment variables (Railway, Render, etc.)

## 📝 Pre-Deployment Checklist

1. ✅ Remove API keys from code (never commit `.env` files)
2. ✅ Add `.env` to `.gitignore`
3. ✅ Test locally with API key
4. ✅ Ensure AI Insights page works

## 🔧 Deployment Steps

### Step 1: Prepare Environment Variable

Your API key: `VITE_HUGGINGFACE_API_KEY`

### Step 2: Deploy to Platform

#### For Vercel:
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd client
vercel

# 3. Add environment variable in dashboard
# Go to: Project Settings → Environment Variables
# Add: VITE_HUGGINGFACE_API_KEY = your_token_here
```

#### For Netlify:
```bash
# 1. Build and deploy
cd client
npm run build

# 2. Drag the 'dist' folder to Netlify dashboard

# 3. Add environment variable
# Go to: Site settings → Environment variables
# Add: VITE_HUGGINGFACE_API_KEY = your_token_here
```

### Step 3: Configure Environment Variables

**Important**: You MUST add the environment variable in your hosting platform's dashboard!

**Where to add it:**
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables  
- **Render**: Environment → Environment Variables
- **Railway**: Project Settings → Variables

**How to add:**
1. Go to your platform's dashboard
2. Find "Environment Variables" section
3. Add new variable:
   - Key: `VITE_HUGGINGFACE_API_KEY`
   - Value: `hf_your_actual_token_here`
4. Save and redeploy

### Step 4: Verify Deployment

After deployment, check:
1. ✅ Site loads correctly
2. ✅ Navigate to `/performance-insights`
3. ✅ AI insights card should appear
4. ✅ Check browser console for any errors

## 🔍 Troubleshooting

### AI Insights Not Showing?

**Problem**: API key not loading in production

**Solution**:
1. Check environment variable is set correctly in dashboard
2. Trigger a new deployment (platforms need rebuild to load new env vars)
3. Check browser console for errors

### Model Loading Slowly?

**Problem**: First API call is slow (model needs to start)

**Solution**: 
- This is normal! Hugging Face free tier needs to "wake up" the model
- First response: ~10-20 seconds
- Subsequent responses: ~1-2 seconds
- The app has automatic fallback to local insights if API fails

### API Rate Limits?

**Problem**: Getting too many requests

**Solution**:
- Hugging Face free tier allows 1,000 requests/month
- The app has smart caching (insights refresh every 5 minutes)
- Falls back to local insights if quota exceeded

## 💡 Pro Tips

1. **Test Locally First**: Make sure everything works with `npm run dev`
2. **Use Fallback**: The built-in insights work great without API
3. **Monitor Usage**: Check Hugging Face dashboard for usage stats
4. **Backup Plan**: If API fails, local insights kick in automatically

## 🎯 What Happens on Deployment?

1. **Build**: Platform builds your app with environment variables
2. **Deploy**: App goes live with AI insights enabled
3. **First Visit**: Model loads (might take 10-20 seconds)
4. **Subsequent Visits**: Fast, cached responses
5. **Fallback**: If API fails, local insights are shown

## ✅ Success Indicators

You'll know it's working when:
- Performance insights page loads
- You see "AI-Powered Performance Insights" card
- Personalized insights appear (not just fallback)
- No errors in browser console

---

**Need Help?** Check browser console for specific error messages!


