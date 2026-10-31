# Medical AI frontend

## API URL

The frontend reads the optional `VITE_API_URL` environment variable. Set it in
the frontend deployment settings (for example, Vercel) to the backend's public
Render URL, without a trailing slash. The Render service name in this repository
suggests `https://medical-ai-assit.onrender.com`; confirm the exact public URL
in the Render dashboard.

When `VITE_API_URL` is unset, local development uses `http://127.0.0.1:5001`,
and deployed builds use the repository's Render URL. Restart the Vite dev
server after changing a local `.env` file, and rebuild/redeploy after changing
the frontend deployment variable.
