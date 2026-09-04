# Deployment Guide

## Render / Railway / VPS
1. Upload the whole project.
2. Set the service root to the project root.
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Add environment variables from `backend/.env.example`.
6. The backend serves the frontend too, so one URL is enough.

## Important
Never put `OPENAI_API_KEY` in `script.js`, `index.html`, or any frontend file.
