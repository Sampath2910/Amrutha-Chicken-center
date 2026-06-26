# Production Deployment Guide - Amrutha Chicken Center

Follow these instructions to deploy the complete Amrutha Chicken Center business platform to a production Linux VPS.

---

## 1. Database Setup (MySQL)
1. Log into your production MySQL instance:
   ```bash
   mysql -u root -p
   ```
2. Create the database and import the schema and seed data from the [schema.sql](file:///c:/Users/akkap/OneDrive/Desktop/Amrutha%20chicken%20center/database/schema.sql) file:
   ```sql
   CREATE DATABASE amrutha_chicken_db;
   USE amrutha_chicken_db;
   SOURCE /path/to/project/database/schema.sql;
   ```

---

## 2. Backend Deployment (Spring Boot 3)
1. **Build the JAR package** inside the `backend` folder:
   ```bash
   mvn clean package -DskipTests
   ```
2. **Environment Variables**: Set the following environment variables on the VPS (e.g. inside `/etc/environment` or via a `.env` file):
   - `DATABASE_URL`: `jdbc:mysql://localhost:3306/amrutha_chicken_db?useSSL=false&serverTimezone=UTC`
   - `DATABASE_USERNAME`: Database username
   - `DATABASE_PASSWORD`: Database password
   - `JWT_SECRET`: A secure 256-bit secret key (hex-encoded string)
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name (for hosting UPI screenshots/images)
   - `CLOUDINARY_API_KEY`: Cloudinary API Key
   - `CLOUDINARY_API_SECRET`: Cloudinary API Secret
3. **Systemd Service**: Create a Systemd service config to run the backend as a background service:
   - Save the following as `/etc/systemd/system/amrutha-backend.service`:
     ```ini
     [Unit]
     Description=Amrutha Chicken Center Spring Boot Backend
     After=syslog.target network.target mysql.service

     [Service]
     User=ubuntu
     WorkingDirectory=/var/www/amrutha/backend
     ExecStart=/usr/bin/java -jar target/amrutha-chicken-backend-0.0.1-SNAPSHOT.jar
     SuccessExitStatus=143
     Restart=always
     RestartSec=5

     [Install]
     WantedBy=multi-user.target
     ```
4. Start and enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start amrutha-backend.service
   sudo systemctl enable amrutha-backend.service
   ```

---

## 3. Frontend Deployment (Next.js 15)
1. **Environment Variables**: Create a `.env.production` file inside the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=https://amruthachicken.com
   ```
2. **Build and Start**:
   ```bash
   npm run build
   ```
3. **Systemd Service**: Create a Systemd service config to run the Next.js process manager:
   - Save the following as `/etc/systemd/system/amrutha-frontend.service`:
     ```ini
     [Unit]
     Description=Amrutha Chicken Center Next.js Frontend
     After=network.target

     [Service]
     User=ubuntu
     WorkingDirectory=/var/www/amrutha/frontend
     ExecStart=/usr/bin/npm start
     Restart=always
     RestartSec=5

     [Install]
     WantedBy=multi-user.target
     ```
4. Start and enable the service:
   ```bash
   sudo systemctl start amrutha-frontend.service
   sudo systemctl enable amrutha-frontend.service
   ```

---

## 4. Nginx Reverse Proxy & SSL Setup
1. Copy the [nginx.conf](file:///c:/Users/akkap/OneDrive/Desktop/Amrutha%20chicken%20center/deployment/nginx.conf) to your Nginx configuration directory:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/amrutha-chicken
   sudo ln -s /etc/nginx/sites-available/amrutha-chicken /etc/nginx/sites-enabled/
   ```
2. Test Nginx and restart:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```
3. **Get Free SSL (Let's Encrypt)**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d amruthachicken.com -d www.amruthachicken.com
   ```
