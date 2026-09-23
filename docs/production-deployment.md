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

For the Docker Compose setup, run Compose with the backend environment file so its `${DB_NAME}`, `${DB_USER}`, and `${DB_PASSWORD}` values are available for interpolation. Set the public API URL separately because Vite embeds it into the frontend at build time:

```bash
export VITE_API_URL=https://api.example.com/api
docker compose --env-file backend/.env -f docker-compose.prod.yml up -d --build
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

- Back up PostgreSQL and test restoring a backup. A backup that has never been restored is only an assumption.
- Monitor Django, reverse-proxy, PostgreSQL, and Celery logs without logging passwords or tokens.
- Renew origin certificates and rotate SMTP/database credentials periodically.
- After deployment, verify login, email code, refresh after browser restart, logout, global logout, password change, email confirmation, admin access, and media URLs.
- If a secret is ever committed or shared, rotate it immediately; changing `SECRET_KEY` invalidates signed Django tokens and sessions.

## PostgreSQL backups on the Raspberry Pi

Use a dedicated backup directory outside the repository. The custom PostgreSQL format is compressed and can be restored selectively with `pg_restore`.

Create a restricted password file for the backup user instead of putting the database password in the command line:

```bash
install -d -m 700 /var/backups/bank-webapp
install -d -m 700 /etc/bank-webapp
sudo sh -c 'printf "127.0.0.1:5432:<production-db>:<production-user>:<production-password>\n" > /etc/bank-webapp/.pgpass'
sudo chmod 600 /etc/bank-webapp/.pgpass
```

Create `/usr/local/sbin/bank-webapp-db-backup`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=/var/backups/bank-webapp
DATABASE=<production-db>
DB_USER=<production-user>
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TARGET="$BACKUP_DIR/${DATABASE}_${STAMP}.dump"

umask 077
pg_dump --format=custom --file="$TARGET" --dbname="$DATABASE" --username="$DB_USER" --no-owner --no-acl
sha256sum "$TARGET" > "$TARGET.sha256"

# Keep 14 days locally. Copy the files to an off-site/private destination as a separate step.
find "$BACKUP_DIR" -type f -name '*.dump' -mtime +14 -delete
find "$BACKUP_DIR" -type f -name '*.sha256' -mtime +14 -delete
```

```bash
sudo chmod 700 /usr/local/sbin/bank-webapp-db-backup
sudo /usr/local/sbin/bank-webapp-db-backup
```

Schedule it with a systemd timer or cron, for example every night at 03:15:

```cron
15 3 * * * root /usr/local/sbin/bank-webapp-db-backup
```

The repository includes `ops/bank-webapp-backup.service` and `ops/bank-webapp-backup.timer`. Install them on the Raspberry Pi after placing the project at `/opt/bank-webapp`:

```bash
sudo install -m 700 ops/backup-db.sh /opt/bank-webapp/ops/backup-db.sh
sudo install -m 644 ops/bank-webapp-backup.service ops/bank-webapp-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bank-webapp-backup.timer
systemctl list-timers bank-webapp-backup.timer
sudo systemctl start bank-webapp-backup.service
```

Check the result with `journalctl -u bank-webapp-backup.service` and copy the generated files to encrypted storage over Tailscale.

Copy backups off the Raspberry Pi to encrypted private storage (for example an encrypted external disk, another machine over SSH, or encrypted object storage). Backups stored only on the Pi are not protection against disk failure, theft, or ransomware. Do not put `.dump` files in Git or inside the public web root.

The automatic `ops/backup-db.sh` script also archives uploaded News images from the Docker volume. If you are not using Docker, back up the media directory separately:

```bash
tar --create --gzip --file="/var/backups/bank-webapp/media_$(date -u +%Y%m%dT%H%M%SZ).tar.gz" --directory=/path/to/backend media
```

Include the encrypted production environment file in the disaster-recovery plan, but never upload it unencrypted with the application or database dumps.

Verify a backup:

```bash
sha256sum --check /var/backups/bank-webapp/<database>_<timestamp>.dump.sha256
```

Restore into a separate empty database first, never directly over production:

```bash
createdb --username=<production-user> bank_app_restore_test
pg_restore --clean --if-exists --no-owner --dbname=bank_app_restore_test /var/backups/bank-webapp/<database>_<timestamp>.dump
```

Run this restore test periodically and record the recovery time. After a disaster restore, run `python manage.py migrate`, `python manage.py check --deploy`, and the application smoke tests before switching traffic back.

## Final go-live gate

- Replace every local credential with a new production credential, including the Resend API key and database password.
- Set `DEBUG=False`, `COOKIE_SECURE=True`, `SECURE_SSL_REDIRECT=True`, and a deliberate HSTS value only after HTTPS is confirmed end to end.
- Set production `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and `FRONTEND_URL` to the real Cloudflare hostnames.
- Run Gunicorn/Uvicorn and Celery under dedicated non-root service users managed by systemd; do not use `runserver`.
- The included Compose setup runs migrations, `seed_categories`, and `collectstatic` before starting Django. The seed command is idempotent and creates/updates both categories and subcategories.
- Put Nginx/Caddy or another reverse proxy in front, serve `static/` and `media/`, and keep PostgreSQL/Redis private.
- Configure firewall rules, automatic OS security updates, SSH keys instead of password login, and restricted admin access.
- Configure Resend domain verification and test login codes, password reset, email changes, and feedback delivery.
- Execute one restore drill and record the time to restore both PostgreSQL and `media/`.
- Review `python manage.py check --deploy` warnings in the production environment and resolve all intentional warnings before launch.

## Tailscale operations

Use Tailscale for administration and backup transport, not as a replacement for Cloudflare's public HTTPS:

- Keep SSH, PostgreSQL, Redis, and the Docker management port bound to the Tailscale interface or localhost.
- Copy encrypted backups to the desktop/laptop over the Tailscale IP with `rsync` or `scp`.
- Restrict SSH with Tailscale ACLs to your own devices and disable password authentication.
- Do not expose PostgreSQL or Redis through Cloudflare or a public port.
- Keep the public application behind Cloudflare and use Full (strict) TLS.