# Deployment and Rollback Guide

This document outlines the manual deployment and recovery procedures for FinanceApp.

## Before Deployment

1. Ensure all tests have passed and the release has been merged into `main`.
2. Record the currently deployed backend and frontend image versions.
3. Identify the new image versions to deploy.
4. Verify that a recent, recoverable PostgreSQL and media backup is available.
5. Review pending database migrations for backward compatibility.

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

## Rollback

If a deployment fails:

1. Inspect the deployment logs and identify the cause.
2. Determine whether any database migrations were applied.
3. Verify that the previous application version is compatible with the current database schema.
4. If compatible, redeploy the previously recorded backend and frontend image versions.
5. Ensure pre-deployment initialization is not rerun with older application code without reviewing its effects.
6. Verify application functionality after recovery.

If the previous application version is incompatible with the database schema, investigate a controlled recovery procedure before proceeding.

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
