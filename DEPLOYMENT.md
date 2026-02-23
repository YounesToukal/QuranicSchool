# Guide de Déploiement - Production

## ☁️ Options de déploiement

### Option 1: Déploiement sur Vercel (Frontend) + Railway (Backend)

#### Frontend sur Vercel

1. Créer un compte sur https://vercel.com
2. Connecter votre repo GitHub
3. Configurer les variables d'environnement:
   - `VITE_API_URL`: URL de votre backend

```bash
npm run build
vercel --prod
```

#### Backend sur Railway

1. Créer un compte sur https://railway.app
2. Créer un nouveau projet
3. Ajouter PostgreSQL depuis le marketplace
4. Déployer le backend:

```bash
cd backend
railway up
```

5. Configurer les variables d'environnement dans Railway
6. Exécuter les migrations: `railway run npm run seed`

### Option 2: VPS (Digital Ocean, Linode, etc.)

#### 1. Préparer le serveur

```bash
# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Installer Nginx
sudo apt-get install nginx

# Installer PM2 pour gérer les processus
sudo npm install -g pm2
```

#### 2. Transférer le code

```bash
# Sur votre machine locale
scp -r . user@your-server:/var/www/qurandec
```

#### 3. Configurer PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE quran_school;
CREATE USER qurandec WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE quran_school TO qurandec;
\q
```

#### 4. Installer et démarrer

```bash
cd /var/www/qurandec

# Frontend
npm install
npm run build

# Backend
cd backend
npm install
npm run build

# Seed database
npm run seed

# Démarrer avec PM2
pm2 start dist/index.js --name qurandec-backend
pm2 save
pm2 startup
```

#### 5. Configurer Nginx

```nginx
# /etc/nginx/sites-available/qurandec

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/qurandec/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/qurandec /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL avec Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker

#### Dockerfile Frontend

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile Backend

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: quran_school
      POSTGRES_USER: qurandec
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DB_HOST: postgres
      DB_NAME: quran_school
      DB_USER: qurandec
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    ports:
      - "5000:5000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 🔒 Checklist de sécurité en production

- [ ] Changer toutes les valeurs par défaut (mots de passe, JWT_SECRET)
- [ ] Activer HTTPS
- [ ] Configurer un vrai service SMS pour les OTP
- [ ] Limiter les tentatives de connexion (rate limiting)
- [ ] Configurer les CORS correctement
- [ ] Sauvegardes automatiques de la base de données
- [ ] Logs centralisés
- [ ] Monitoring des erreurs (Sentry)
- [ ] Variables d'environnement sécurisées

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
pm2 restart qurandec-backend
```

### Logs PostgreSQL

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## 🔄 Mises à jour

```bash
# Arrêter l'application
pm2 stop qurandec-backend

# Mettre à jour le code
git pull

# Backend
cd backend
npm install
npm run build
pm2 restart qurandec-backend

# Frontend
cd ..
npm install
npm run build

# Redémarrer Nginx
sudo systemctl restart nginx
```

## 📱 Configuration PWA supplémentaire

Pour que la PWA fonctionne parfaitement:

1. Servir via HTTPS
2. Vérifier que le manifest est accessible
3. Vérifier que le service worker s'enregistre
4. Tester avec Lighthouse

---

Pour toute question concernant le déploiement, consultez la documentation de la plateforme choisie.
