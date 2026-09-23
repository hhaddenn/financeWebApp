# Production Deployment

Checklist for deploying the Django backend and Vite frontend behind Cloudflare on the Raspberry Pi.

## Before exposing the application

- Use separate production credentials for PostgreSQL, SMTP, Cloudflare, and the Django admin.
- Generate a new random `SECRET_KEY` for production. Never reuse the key in the local `.env`.
- Keep `.env` outside version control and restrict it to the service user (`chmod 600 backend/.env`).
- If environment files were ever committed or uploaded, rotate the Django, database, and SMTP credentials before production. Removing the files from the latest commit is not enough; use repository history cleanup if the repository is shared.
- Confirm that no secrets, database dumps, media files, or `frontend/dist` credentials are committed.
- Update all dependencies in a controlled virtual environment and run the tests before deployment.

## Backend environment

Create `backend/.env` on the Raspberry Pi with values similar to:

```env
SECRET_KEY=<long-random-production-secret>
DEBUG=False
ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
DB_NAME=<production-db>
DB_USER=<production-user>
DB_PASSWORD=<production-password>
DB_HOST=127.0.0.1
DB_PORT=5432
EMAIL_HOST_USER=<smtp-user>
EMAIL_HOST_PASSWORD=<smtp-password>
DEFAULT_FROM_EMAIL=<verified-sender>
FEEDBACK_FROM_EMAIL=<verified-feedback-sender>
FEEDBACK_RECIPIENT=<admin-email>
FRONTEND_URL=https://app.example.com
```

Use exact origins including `https://` and without a trailing slash. `ALLOWED_HOSTS` contains hostnames only.

## Django release steps

From the backend directory:

```bash
source ../.venv/bin/activate
python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py test finance
```

Run the application with a production WSGI/ASGI server such as Gunicorn or Uvicorn. Do not use `manage.py runserver` in production.

## Cloudflare and reverse proxy

- Use Cloudflare SSL/TLS mode **Full (strict)**.
- Install a valid origin certificate on the reverse proxy, or use a trusted certificate.
- Proxy only the public frontend/API hostnames; keep PostgreSQL, Redis, SSH, and Django internals private.
- Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` to Django.
- Redirect HTTP to HTTPS at the proxy and keep `SECURE_SSL_REDIRECT=True`.
- Allow the frontend origin in CORS and CSRF settings; do not use `*` with credentials.
- Serve `/media/` and `/static/` from the reverse proxy or object storage. Django serves media only when `DEBUG=True`.
- Limit upload size and allowed file types at the proxy and application boundary.
- Put rate limiting/WAF rules on login, password reset, admin, and email-change routes.

## Account security implemented

- Refresh tokens are `HttpOnly` cookies and are not stored in `localStorage`.
- `COOKIE_SECURE=True` is required for production HTTPS.
- “Keep me signed in” persists the refresh cookie for 30 days; the normal cookie is a browser-session cookie.
- Username, password, and email changes require the current password.
- Email changes require confirmation through the new email address.
- Password changes and global logout blacklist outstanding refresh tokens.
- Password changes require matching new-password and confirmation fields.

Access tokens already issued to another device remain valid until their short access-token expiry. The refresh token blacklist prevents that device from creating a new access token.

## Operational checks

- Back up PostgreSQL and test restoring a backup.
- Monitor Django, reverse-proxy, PostgreSQL, and Celery logs without logging passwords or tokens.
- Renew origin certificates and rotate SMTP/database credentials periodically.
- After deployment, verify login, email code, refresh after browser restart, logout, global logout, password change, email confirmation, admin access, and media URLs.
- If a secret is ever committed or shared, rotate it immediately; changing `SECRET_KEY` invalidates signed Django tokens and sessions.