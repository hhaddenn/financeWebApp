FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app/backend

WORKDIR /app/backend
COPY ops/backend-entrypoint.sh /usr/local/bin/backend-entrypoint
RUN chmod 700 /usr/local/bin/backend-entrypoint

ENTRYPOINT ["backend-entrypoint"]