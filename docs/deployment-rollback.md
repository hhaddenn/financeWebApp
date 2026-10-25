# Deployment and Rollback Guide

This document outlines the manual deployment and recovery procedures for FinanceApp.

## Before Deployment

1. Ensure all tests have passed and the release has been merged into `main`.
2. Record the currently deployed backend and frontend image versions.
3. Identify the new image versions to deploy.
4. Verify that a recent, recoverable PostgreSQL and media backup is available.
5. Review pending database migrations for backward compatibility.

## One-Time Volume Ownership Migration

The updated backend image is configured to run as UID/GID `10001:10001` instead of root.

New Docker volumes can inherit the ownership configured in the backend
image. Existing volumes retain their previous ownership and may require
a one-time migration before deploying the non-root backend.

This migration is a manual maintenance operation. It must not run
automatically during deployment or rollback.

Before migrating existing volumes:

1. Schedule a maintenance window and prevent new application writes.
   Stop the web backend, Celery workers, and any initialization processes
   that could write to the affected volumes. Prevent automatic restarts
   during maintenance.
2. Identify the actual Docker volume names used by the deployment.
   Do not assume they match the logical names in the Compose file.
3. Create fresh PostgreSQL and media backups while application writes
   are paused. Verify the backups and confirm that recovery is possible.
4. Audit the media and static volumes using:

    `sh scripts/audit-volume-ownership.sh VOLUME_NAME`

5. If necessary, perform an explicit, controlled ownership migration
   of the confirmed media and static volumes to UID/GID `10001:10001`.
   Never apply this operation to PostgreSQL or Redis volumes, unrelated
   volumes, or the host project directory.
6. Repeat the ownership audit, verify existing media files, and confirm
   that the application can write to the required directories.
7. Complete application initialization and restart the services only
   after all checks succeed.

If verification fails, do not proceed with the deployment. Investigate
the failure and follow a reviewed recovery procedure.

The ownership migration must not be added to `prepare-deploy.sh` or
to the backend container entrypoint.

Rollback to an older image may require another permissions review.

## Deployment

1. Configure the target image versions in the deployment environment.
2. Initiate the deployment manually.
3. Ensure the pre-deployment process completes successfully:
    - Create PostgreSQL and media backups.
    - Pull the required application images.
    - Run Django migrations, category seeding, and static file collection.
4. Verify that the backend, frontend, and background workers start correctly.
5. Check application functionality, service health, and logs.

**Note:** The pre-deployment procedure must be configured and validated before being enabled in production.

## Manual Service Activation

Run these commands only after the pre-deployment preparation has
completed successfully and the target image tags have been verified.

Keep the previous backend and frontend image tags recorded so that
a rollback remains possible.

### Backend Update

When the backend image changes, update the web service first:

```bash
docker compose -f docker-compose.prod.yml \
    up -d --no-deps --wait --wait-timeout 120 backend
```

### Background Workers Update

```bash
docker compose -f docker-compose.prod.yml \
    up -d --no-deps --wait --wait-timeout 120 celery
```

```bash
docker compose -f docker-compose.prod.yml \
    up -d --no-deps --wait --wait-timeout 120 celery-beat
```

Celery Beat and Celery worker do not have healthchecks, so their logs should be verified after the update.

```bash
docker compose -f docker-compose.prod.yml \
    logs --tail=50 celery celery-beat
```

### Frontend Update

The frontend should be updated when its image changes.

```bash
docker compose -f docker-compose.prod.yml \
    up -d --no-deps --wait --wait-timeout 120 frontend
```

The frontend has no healthcheck, so verify the HTTP response and core application functionality after the update.

## Rollback

If a deployment fails:

1. Inspect the deployment logs and identify the cause.
2. Determine whether any database migrations were applied.
3. Verify that the previous application version is compatible with the current database schema.
4. If compatible, redeploy the previously recorded backend and frontend image versions.
5. Ensure pre-deployment initialization is not rerun with older application code without reviewing its effects.
6. Verify application functionality after recovery.

If the previous application version is incompatible with the database schema, investigate a controlled recovery procedure before proceeding.

### Rollback Preparation

Rollback requires an explicit change to the pre-deployment command.

For a normal deployment:

```bash
sh scripts/prepare-deploy.sh
```

For a rollback:

```bash
sh scripts/prepare-deploy.sh --rollback
```

Before initiating a rollback:

1. Verify that the previous application version is compatible with the current database schema.
2. Select the previously deployed backend and frontend image versions.
3. Configure the deployment process to use the rollback command instead of the normal command.
4. Confirm that only one pre-deployment command will run.
5. Initiate the rollback manually.
6. Verify application functionality.
7. Restore the normal pre-deployment command after recovery.

Rollback mode creates a backup and pulls the selected images, but skips Django initialization.

The rollback preparation script does not automatically recreate or
restart the application containers.

After verifying database compatibility, the affected services
(`backend`, `celery`, `celery-beat`, and `frontend`) must be manually
activated using the previously deployed image versions.

Never run initialization with older application code without first reviewing database compatibility.

## Release Version Tracking

Before each deployment, privately record:

- Previously deployed backend and frontend versions.
- Target backend and frontend versions.
- Backup verification status.
- Deployment outcome.

Do not rely on the mutable `latest` tag to identify a previous release.

Keep completed deployment records and infrastructure-specific information outside the public repository.

## Safety Rules

- Never run `docker compose down -v` during a rollback.
- Never assume that rolling back Docker images also reverses database migrations.
- Never restore a database backup automatically.
- Consider data created after the backup before performing a restore.
- Never commit credentials, tokens, private server paths, or sensitive configuration.
