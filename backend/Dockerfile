FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY requirements-translations.txt /app/requirements-translations.txt

ARG INSTALL_TRANSLATIONS=false

RUN if [ "$INSTALL_TRANSLATIONS" = "true" ]; then \
        pip install --no-cache-dir -r /app/requirements-translations.txt; \
    fi

COPY backend /app/backend

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --create-home app \
    && mkdir -p /app/backend/media /app/backend/staticfiles \
    && chown app:app /app/backend/media /app/backend/staticfiles

WORKDIR /app/backend
COPY ops/backend-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chown root:app /usr/local/bin/backend-entrypoint \
    && chmod 750 /usr/local/bin/backend-entrypoint

ENTRYPOINT ["backend-entrypoint"]

USER app
