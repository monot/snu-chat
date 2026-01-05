# Vercel Deployment Guide

This guide describes how to deploy the SNUF Chatbot to [Vercel](https://vercel.com).

## Prerequisites
- A GitHub account
- A Vercel account (can sign up with GitHub)
- Access to the OpenAI API Key

## 1. Push to GitHub
Make sure your latest code is pushed to a GitHub repository.
```bash
git add .
git commit -m "Ready for deployment"
git push
```

## 2. Import Project in Vercel
1. Log in to Vercel.
2. Click "Add New..." -> "Project".
3. Select your GitHub repository (`snuf-chat`).
4. Click "Import".

## 3. Configure Project
In the "Configure Project" screen:
- **Framework Preset**: Next.js (should be auto-detected)
- **Root Directory**: `./` (default)
- **Build and Output Settings**: Default (`next build` / `next start`)

### Environment Variables
Expand the **Environment Variables** section and add the following:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | Your OpenAI API Key (starts with `sk-...`) |

> [!IMPORTANT]
> Without `OPENAI_API_KEY`, the chatbot will not work.

## 4. Deploy
Click **"Deploy"**.
Vercel will build your project. This usually takes 1-2 minutes.
Once finished, you will see a "Congratulations!" screen with your dashboard URL (e.g., `https://snuf-chat.vercel.app`).

## Troubleshooting
- **File not found (embeddings.json)**: The `next.config.mjs` is configured to include `data/embeddings.json`. If you see errors related to missing files, ensure `data/embeddings.json` exists in your git repository.
- **OpenAI Error**: Check if the API Key is correct and has quota remaining.
