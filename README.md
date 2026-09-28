# financeWebApp

**financeWebApp** is a personal finance management web application for managing financial accounts and keeping track of transactions in one place.

🌐 **Live application:** https://finance.hugo-hadden.com

---

## ✨ Features

* 💰 **Financial accounts** — manage your financial accounts in one place
* 💳 **Transactions** — record and manage financial transactions
* 🏷️ **Categories** — organize transactions using categories
* 🔐 **Authentication** — secure user registration and login
* 🌍 **Translations** — multilingual support
* 📧 **Email** — email-based application functionality
* 💬 **Feedback** — submit feedback directly through the application
* 🔗 **REST API** — backend API built with Django REST Framework
* 🐳 **Docker** — containerized application and production deployment

---

## 🌐 Live Application

Try the application:

**https://finance.hugo-hadden.com**

---

## 🛠️ Built With

### Frontend

* React
* Vite
* JavaScript

### Backend

* Python
* Django
* Django REST Framework
* JWT authentication

### Infrastructure

* PostgreSQL
* Redis
* Celery
* Docker
* Nginx
* Gunicorn

### Other

* Argos Translate
* SMTP email integration

---

## 🏗️ Architecture

```text
                    ┌──────────────────┐
                    │   React / Vite   │
                    │    Frontend      │
                    └────────┬─────────┘
                             │
                          REST API
                             │
                             ▼
                    ┌──────────────────┐
                    │ Django / DRF     │
                    │    Backend       │
                    └───────┬───┬──────┘
                            │   │
                   ┌────────┘   └────────┐
                   ▼                     ▼
            ┌──────────────┐      ┌──────────────┐
            │  PostgreSQL  │      │    Redis     │
            │   Database   │      │    Broker    │
            └──────────────┘      └───────┬──────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │    Celery    │
                                   │    Worker    │
                                   └──────────────┘
```

---

## 🐳 Self-hosting

The application is designed to run with Docker Compose.

### Requirements

* Docker
* Docker Compose
* Git

Clone the repository:

```bash
git clone https://github.com/hhaddenn/financeWebApp.git
cd financeWebApp
```

Create the environment files from the provided templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure the environment variables for your environment and start the application:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The frontend will then be available at:

```text
http://localhost:8080
```

The backend API runs on:

```text
http://localhost:8000
```

Stop the application with:

```bash
docker compose -f docker-compose.prod.yml down
```

---

## 🔐 Security

The application uses environment-based configuration for sensitive values and includes several production security measures.

These include:

* JWT authentication
* CSRF protection
* CORS configuration
* Secure cookies
* HTTPS-aware configuration
* HTTP security headers
* PostgreSQL for production data
* Environment variables for credentials and secrets
* Secrets excluded from version control

**Never commit real credentials, API keys, or `.env` files to the repository.**

---

## 💾 Backups

The repository includes scripts and systemd configuration for backing up:

* PostgreSQL data
* User-uploaded media

Backups include SHA-256 checksums and an automatic retention policy.

---

## 📁 Project Structure

```text
financeWebApp/
├── backend/                 # Django backend and REST API
├── frontend/                # React/Vite frontend
├── ops/                     # Deployment and backup scripts
├── docker-compose.prod.yml  # Production Docker Compose setup
├── requirements.txt         # Python dependencies
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🗺️ Roadmap

Some planned improvements include:

* 📱 Mobile application
* 📊 Additional financial features
* 🌍 Additional language support
* ✨ Further improvements to the user experience

The planned mobile application will use the existing backend API.

---

## 📄 License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) for the full license text.

---

## 👨‍💻 Author

**Hugo Hadden**

Personal project focused on building a full-stack personal finance application with a modern web stack and production-oriented deployment.

🌐 **Live application:** https://finance.hugo-hadden.com

💻 **Repository:** https://github.com/hhaddenn/financeWebApp




