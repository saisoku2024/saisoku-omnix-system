# Deploy Backend to Render

Use this service configuration when creating the FastAPI backend on Render.

## Render Settings

```txt
Root Directory: reporting-backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

## Environment Variables

Set these values in Render only. Do not add real secrets to Git.

```txt
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=use-a-long-random-token
```

Optional but recommended:

```txt
PYTHON_VERSION=3.11.9
```

## After Deploy

Open these URLs:

```txt
https://<your-render-service>.onrender.com/
https://<your-render-service>.onrender.com/health
https://<your-render-service>.onrender.com/docs
```

Then set the Vercel frontend variable:

```txt
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
NEXT_PUBLIC_ADMIN_API_TOKEN=use-the-same-admin-api-token
ADMIN_UI_PASSWORD=use-an-admin-login-password
AUTH_SESSION_SECRET=use-a-different-long-random-session-secret
```
