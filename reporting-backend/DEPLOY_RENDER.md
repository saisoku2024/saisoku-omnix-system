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
```
