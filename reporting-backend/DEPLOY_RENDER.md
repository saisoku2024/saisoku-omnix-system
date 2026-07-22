# Deploy Backend to Render

Use this service configuration when creating the FastAPI backend on Render.

## Render Settings

```txt
Root Directory: reporting-backend
Build Command: pip install -r requirements.txt
Start Command: python main.py
Health Check Path: /health
Python Version: 3.11.9
```

## Environment Variables

Set these values in Render only. Do not add real secrets to Git.

```txt
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=use-a-long-random-token
ADMIN_USERNAME=use-a-private-admin-username
ADMIN_PASSWORD=use-a-strong-admin-password
JWT_SECRET_KEY=use-a-different-long-random-jwt-secret
```

Required runtime:

```txt
PYTHON_VERSION=3.11.9
```

The backend fails fast when `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is
missing. If `/health` does not come up after deploy, check the Render environment
variables before debugging application data.

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
ADMIN_API_TOKEN=use-the-same-admin-api-token
ADMIN_UI_PASSWORD=use-an-admin-login-password
AUTH_SESSION_SECRET=use-a-different-long-random-session-secret
```

The frontend requires Node.js `>=20.19.0`; this is declared in
`reporting-dashboard/package.json`. After changing any Vercel environment
variable, redeploy the frontend so server routes receive the new values.
