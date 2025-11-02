# Quick Start Guide - Running GoodStudy Locally

## 🚀 Running the App

### Method 1: Use Built-in Smart Insights (Immediate - No Setup)

**This works right now with ZERO setup!**

1. **Start the development server**:
   ```bash
   cd client
   npm run dev
   ```

2. **Visit**: http://localhost:5173

3. **Navigate to Performance Insights**:
   - Click "Insights" in the header menu, OR
   - Visit: http://localhost:5173/performance-insights

4. **You'll see smart insights immediately** - no API keys needed!

✅ **That's it!** The built-in system analyzes your performance and gives you:
- Overall accuracy assessment
- Weak area identification
- Personalized suggestions
- Motivational tips

---

## 🤖 Adding AI-Powered Insights (Optional)

If you want AI-generated insights (more personalized), follow these steps:

### Step 1: Get Free Hugging Face API Key

1. Go to: https://huggingface.co/
2. Click "Sign Up" (free, no credit card)
3. Create an account
4. Go to: https://huggingface.co/settings/tokens
5. Click "New token"
6. Name it: `goodstudy-api`
7. Select "Read" permission
8. Click "Generate token"
9. **Copy the token** (starts with `hf_...`)

### Step 2: Add API Key to Your Project

1. In the `client` folder, create or edit `.env` file:
   ```bash
   cd client
   touch .env
   # or
   nano .env
   # or use your code editor
   ```

2. Add this line to the `.env` file:
   ```
   VITE_HUGGINGFACE_API_KEY=hf_your_token_here
   ```

3. Save the file

### Step 3: Restart the Server

1. Stop the current server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Test AI Insights

1. Visit: http://localhost:5173/performance-insights
2. You should see the purple "AI-Powered Performance Insights" card
3. Wait a few seconds for the AI to generate insights
4. Done! 🎉

---

## 📋 What You Need (Nothing Extra!)

✅ **Already Installed**:
- Node.js
- npm
- React

❌ **Don't Need**:
- Python
- Separate apps
- Additional installations
- Credit cards

---

## 🔍 Troubleshooting

### AI Insights Not Showing?

**Solution**: The built-in smart insights work immediately without any API key!

Just visit `/performance-insights` and you'll see valuable insights based on your data.

### Want to Test AI?

1. Sign up for free Hugging Face account
2. Get your API token
3. Add it to `.env` file
4. Restart dev server
5. Visit `/performance-insights`

### First AI Call Slow?

**Normal!** The free Hugging Face model needs to "wake up" on first use (~10-20 seconds). Subsequent calls are fast (~1-2 seconds).

---

## 💡 Pro Tips

1. **Start with Built-in Insights**: They work great and show immediately
2. **Test AI Later**: Add Hugging Face when you're ready
3. **No Python Needed**: Everything runs in your browser
4. **Free Forever**: Both built-in and Hugging Face AI are free

---

## 🎯 Quick Commands

```bash
# Start development server
cd client
npm run dev

# Your app runs at:
# http://localhost:5173

# View insights at:
# http://localhost:5173/performance-insights
```

**That's all you need!** 🚀

