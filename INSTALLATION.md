# 🚀 Guide d'installation rapide - QuranDec

## Étape 1: Installer PostgreSQL

### Windows
1. Télécharger PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installer avec le mot de passe: `postgres`
3. Le serveur démarre automatiquement sur le port 5432

### Vérifier l'installation
```powershell
psql --version
```

## Étape 2: Créer la base de données

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer la base de données
CREATE DATABASE quran_school;

# Quitter psql
\q
```

## Étape 3: Installer les dépendances

### Frontend
```powershell
# Dans le dossier racine
npm install
```

### Backend
```powershell
cd backend
npm install
cd ..
```

## Étape 4: Initialiser la base de données

```powershell
cd backend
npm run seed
cd ..
```

Cela créera:
- ✅ Toutes les tables nécessaires
- ✅ Un compte admin: `admin@qurandec.com` / `admin123`
- ✅ Un compte enseignant: `teacher@qurandec.com` / `teacher123`
- ✅ Des données d'exemple (sourates, hizbs, classe)

## Étape 5: Démarrer l'application

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```

Le backend démarre sur http://localhost:5000

### Terminal 2 - Frontend
```powershell
# Dans un nouveau terminal, à la racine
npm run dev
```

Le frontend démarre sur http://localhost:3000

## 🎉 C'est prêt !

Ouvrez http://localhost:3000 dans votre navigateur.

### Comptes de test

**Administrateur:**
- Email: `admin@qurandec.com`
- Mot de passe: `admin123`

**Enseignant:**
- Email: `teacher@qurandec.com`
- Mot de passe: `teacher123`

**Parent (inscription):**
1. Cliquer sur "Inscrire mon enfant"
2. Numéro: n'importe quel numéro (ex: +33612345678)
3. Code de classe: `MOSQ-01`
4. Se connecter en tant qu'admin pour approuver
5. Revenir à la page de login parent et entrer le numéro
6. Code OTP affiché dans la console backend (en dev)

## ⚠️ Dépannage

### Erreur "ECONNREFUSED" au démarrage du backend
→ PostgreSQL n'est pas démarré. Démarrer le service PostgreSQL.

### Erreur "database does not exist"
→ Créer la base de données avec `CREATE DATABASE quran_school;`

### Port déjà utilisé
→ Changer les ports dans les fichiers .env si nécessaire

## 📱 Tester la PWA

1. Construire la version de production:
```powershell
npm run build
npm run preview
```

2. Ouvrir http://localhost:4173
3. Dans Chrome, cliquer sur l'icône d'installation dans la barre d'adresse

## 🔄 Réinitialiser la base de données

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Supprimer et recréer
DROP DATABASE quran_school;
CREATE DATABASE quran_school;
\q

# Réexécuter le seed
cd backend
npm run seed
```

## 📚 Prochaines étapes

- Ajouter de vraies données coraniques (114 sourates complètes)
- Configurer un service SMS pour les OTP
- Déployer sur un serveur de production
- Personnaliser les couleurs et le logo

Bon développement ! 🚀
