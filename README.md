# Amrutha Chicken Center

A premium web application and ordering system for **Amrutha Chicken Center**, designed with a Next.js standalone frontend, a Spring Boot REST backend, and a MySQL database. This monorepo is fully containerized and configured for automated deployments on Render.

---

## Repository Structure

```text
Amrutha-Chicken-center/
├── .github/                 # GitHub workflows and actions
├── backend/                 # Spring Boot REST API
│   ├── src/                 # Java source code & properties
│   ├── Dockerfile           # Multi-stage Docker file targeting JRE 17 Alpine
│   ├── pom.xml              # Maven dependencies & build specification
│   └── .env.example         # Template for backend environment variables
├── frontend/                # Next.js Web App
│   ├── src/                 # React components, pages, hooks, and styles
│   ├── public/              # Static assets & icons
│   ├── Dockerfile           # Multi-stage Next.js builder using Node-18 Alpine
│   ├── next.config.ts       # Next.js compiler standalone configuration
│   └── .env.example         # Template for frontend environment variables
├── database/                # Database Scripts
│   ├── schema.sql           # Complete MySQL database DDL schema
│   └── update_passwords.sql # Database password hashing migrations
├── deployment/              # Operations & Hosting files
│   ├── nginx.conf           # Reverse proxy configuration
│   ├── backup.sh            # MySQL compressed backup scripts
│   └── restore.sh           # MySQL database restore script
├── docker-compose.yml       # Orchestrates frontend, backend, and database locally
├── render.yaml              # Render Blueprint specification for automated deploys
└── .gitignore               # Excludes build caches, node_modules, and secrets
```

---

## Deployment Prerequisites

### 1. Database
*   A hosted **MySQL 8.0+** instance (e.g., Aiven, Railway, AWS RDS, or Render PostgreSQL/MySQL third-party integrations).

### 2. File Storage (Optional)
*   **Cloudinary Account**: Required if you plan to upload and host product images dynamically on the cloud. If not provided, the application automatically falls back to local disk storage in the `uploads/` directory.

### 3. Messaging Integration
*   WhatsApp Business redirection is integrated natively into the client-side checkout to send orders directly to the store manager.

---

## Environment Variables

### Backend Configuration
Copy `backend/.env.example` to `backend/.env` and supply the following variables:

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active profile (`dev` or `prod`) | `prod` |
| `PORT` | Web port for Spring Boot container | `8080` |
| `DATABASE_URL` | JDBC Connection String | `jdbc:mysql://<host>:3306/amrutha_chicken_db?...` |
| `DATABASE_USERNAME` | Database username | `root` |
| `DATABASE_PASSWORD` | Database password | `your_secure_password` |
| `JWT_SECRET` | 256-bit Hex Key for signing JWTs | `404E635266556... (64 hex characters)` |
| `JWT_EXPIRATION_MS` | JWT token validity in milliseconds | `86400000` (24 Hours) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `your_cloudinary_api_secret` |

### Frontend Configuration
Copy `frontend/.env.example` to `frontend/.env.local` and supply the following variables:

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend URL (REST Endpoint) | `https://amrutha-chicken-backend.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | Site Domain (used for WhatsApp links) | `https://amrutha-chicken-center.onrender.com` |

---

## How to Deploy on Render

This project contains a `render.yaml` Blueprint definition file, allowing you to launch both frontend and backend services instantly.

1.  Connect your GitHub repository to [Render](https://render.com/).
2.  Go to the **Blueprints** section in the Render Dashboard and click **New Blueprint Instance**.
3.  Select the `Amrutha-Chicken-center` repository.
4.  Configure the required environment variables when prompted:
    *   For **backend**: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET` (and optionally Cloudinary credentials).
    *   For **frontend**: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`.
5.  Click **Approve** to build and spin up the services automatically.
