# QuranDec - École Coranique

Une plateforme web progressive (PWA) complète pour le suivi des élèves de l'école coranique, avec gestion des progressions, système de points motivant et classements.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)

## ✨ Fonctionnalités

### Pour les Parents
- 📊 Suivi en temps réel de la progression de l'enfant
- 📖 Visualisation des 60 Hizb du Coran
- 🏆 Système de points "Barakah" motivant
- 📈 Classements de classe et général
- 🌙 Versets coraniques inspirants quotidiens
- 🌐 Interface bilingue (Français/Arabe)

### Pour les Enseignants
- ⚡ Interface "Smart-Log" ultra-rapide (< 5 secondes par élève)
- ✅ Saisie des progressions quotidiennes
- 📝 Évaluation de l'assiduité et du comportement
- 👥 Vue d'ensemble de la classe
- 🔢 Code de classe unique pour les inscriptions
- 💾 Synchronisation hors-ligne

### Pour les Administrateurs
- 👤 Gestion des utilisateurs (enseignants, parents, élèves)
- 🏫 Gestion des classes
- ✔️ Validation des demandes d'inscription
- 📊 Tableaux de bord et statistiques
- ⚙️ Configuration du système de points

## 🛠 Technologies utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour un build ultra-rapide
- **Tailwind CSS** pour le design responsive
- **Zustand** pour la gestion d'état
- **i18next** pour l'internationalisation
- **PWA** avec service workers (Workbox)

### Backend
- **Node.js** avec Express
- **TypeScript** pour la sécurité du typage
- **PostgreSQL** comme base de données
- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe

## 📦 Installation

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### 1. Cloner le projet

```bash
cd "c:\Users\Toukal01\Desktop\QuranDec Website"
```

### 2. Installer les dépendances

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 3. Configuration de la base de données

Créer une base de données PostgreSQL:

```sql
CREATE DATABASE quran_school;
```

### 4. Configuration des variables d'environnement

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

#### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=quran_school
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### 5. Initialiser la base de données

```bash
cd backend
npm run seed
```

Cela va créer:
- Les tables nécessaires
- Un compte admin (admin@qurandec.com / admin123)
- Un compte enseignant (teacher@qurandec.com / teacher123)
- Des données d'exemple des sourates et hizbs

## 🚀 Utilisation

### Démarrer le backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur http://localhost:5000

### Démarrer le frontend

```bash
npm run dev
```

L'application démarre sur http://localhost:3000

### Construire pour la production

#### Frontend
```bash
npm run build
```

#### Backend
```bash
cd backend
npm run build
npm start
```

## 🏗 Architecture

```
QuranDec Website/
├── src/                          # Frontend React
│   ├── components/              # Composants réutilisables
│   │   ├── common/             # Composants communs
│   │   ├── quran/              # Composants liés au Coran
│   │   ├── student/            # Composants élèves
│   │   └── teacher/            # Composants enseignants
│   ├── pages/                   # Pages principales
│   ├── store/                   # Gestion d'état (Zustand)
│   ├── lib/                     # Utilitaires et API
│   ├── i18n/                    # Internationalisation
│   └── types/                   # Types TypeScript
│
├── backend/                     # Backend Node.js
│   └── src/
│       ├── config/             # Configuration
│       ├── middleware/         # Middlewares Express
│       ├── routes/             # Routes API
│       └── scripts/            # Scripts utilitaires
│
└── public/                      # Assets statiques
```

## 📡 API Documentation

### Authentification

#### POST /api/auth/request-otp
Demander un code OTP par SMS

```json
{
  "phone": "+33612345678"
}
```

#### POST /api/auth/verify-otp
Vérifier le code OTP et se connecter

```json
{
  "phone": "+33612345678",
  "code": "123456"
}
```

#### POST /api/auth/login
Connexion avec email/mot de passe (admin/enseignant)

```json
{
  "email": "admin@qurandec.com",
  "password": "admin123"
}
```

### Étudiants

#### GET /api/students/:id
Récupérer un étudiant par ID

#### GET /api/students/parent/:parentId
Récupérer les étudiants d'un parent

#### GET /api/students/class/:classId
Récupérer les étudiants d'une classe

### Progression

#### POST /api/progress
Créer une entrée de progression

```json
{
  "studentId": 1,
  "date": "2026-02-19",
  "pagesMemorized": 2,
  "pagesRevised": 1,
  "attendance": "present",
  "concentration": "high"
}
```

#### GET /api/progress/student/:studentId
Récupérer la progression d'un étudiant

### Classes

#### GET /api/classes
Récupérer toutes les classes

#### POST /api/classes
Créer une nouvelle classe

#### POST /api/classes/:id/generate-code
Générer un nouveau code de classe

### Inscriptions

#### POST /api/registrations
Créer une demande d'inscription

#### POST /api/registrations/:id/approve
Approuver une demande

#### POST /api/registrations/:id/reject
Rejeter une demande

### Classements

#### GET /api/rankings/global?period=monthly
Classement général (monthly ou total)

#### GET /api/rankings/class/:classId?period=monthly
Classement d'une classe

### Données Coraniques

#### GET /api/quran/surahs
Liste des sourates

#### GET /api/quran/hizbs
Liste des hizbs

#### GET /api/quran/daily-verse
Verset du jour

## 🎨 Charte graphique

### Couleurs
- **Primaire**: #357d7f (Vert d'eau profond)
- **Secondaire**: #D4AF37 (Or métallique)
- **Fond**: #FEFBF6 (Blanc cassé)

### Typographie
- **Français**: Montserrat
- **Arabe**: Amiri
- **Versets**: Scheherazade New

## 📱 PWA (Progressive Web App)

L'application est installable sur mobile et desktop:
- Fonctionne hors-ligne (consultation des données)
- Synchronisation automatique au retour en ligne
- Notifications push (à configurer)
- Icônes d'application personnalisées

## 🔒 Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Protection CSRF
- Validation des données côté serveur
- HTTPS recommandé en production

## 📄 Licence

Ce projet est sous licence privée.

## 👥 Support

Pour toute question ou problème:
- Email: support@qurandec.com
- Documentation: https://docs.qurandec.com

---

**Note**: Pour des données coraniques complètes (114 sourates, 60 hizbs, 6236 versets), vous pouvez utiliser les datasets mentionnés dans la modélisation technique (Quran-db).
