# 🔑 Getting Your Free Gemini API Key

## Step-by-Step Guide

### 1. Visit Google AI Studio

Go to: **https://ai.google.dev** or **https://aistudio.google.com**

### 2. Sign In

- Click "Get API Key" or "Sign In"
- Use your Google account

### 3. Create API Key

1. Click **"Get API key"** in the top right
2. Click **"Create API key"**
3. Select **"Create API key in new project"** (or choose existing project)
4. Your API key will be generated instantly!

### 4. Copy Your Key

- Copy the entire key (starts with `AIza...`)
- Keep it secure - don't share publicly

### 5. Add to Your Project

Open `apps/api/.env` and add:

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIza...your_key_here
```

## ✅ Verify It Works

Test your key:

```powershell
cd apps/api
bun run --eval "console.log(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '✅ API Key loaded!' : '❌ API Key not found')"
```

## 🆓 Free Tier Limits

Gemini 2.0 Flash (Free):

- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per day**

Perfect for development and this assignment! ✨

## 🔒 Security Tips

✅ **DO:**

- Keep your `.env` file in `.gitignore`
- Use environment variables
- Rotate keys if exposed

❌ **DON'T:**

- Commit API keys to GitHub
- Share keys publicly
- Use in client-side code

## 🚨 If You Lost Your Key

1. Go back to https://aistudio.google.com
2. Click on your project
3. Go to "API keys"
4. Create a new key or view existing ones

## 🎯 Models Available

For this project, we use:

- **gemini-2.0-flash-exp** - Fast, free, perfect for production

You can also try:

- `gemini-1.5-flash` - Stable version
- `gemini-1.5-pro` - More powerful (paid)

---

**That's it!** You're ready to build with Gemini AI! 🚀
