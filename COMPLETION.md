# 🕌 QuranDec - Plateforme de Suivi des Élèves de l'École Coranique

## ✅ Installation complète réussie !

Votre application QuranDec a été créée avec succès. Voici ce qui a été mis en place :

### 📁 Structure du Projet

```
QuranDec Website/
├── 🎨 Frontend (React + TypeScript + Tailwind)
│   ├── Pages principales (Parent, Enseignant, Admin)
│   ├── Composants réutilisables
│   ├── Système d'état avec Zustand
│   ├── Internationalisation (FR/AR)
│   └── PWA configurée
│
├── ⚙️ Backend (Node.js + Express + TypeScript)
│   ├── API REST complète
│   ├── Authentification JWT
│   ├── Routes protégées par rôles
│   └── Base de données PostgreSQL
│
└── 📚 Documentation
    ├── README.md (Documentation complète)
    ├── INSTALLATION.md (Guide d'installation)
    └── DEPLOYMENT.md (Guide de déploiement)
```

### ✨ Fonctionnalités Implémentées

#### Pour les Parents 👨‍👩‍👧‍👦
- ✅ Tableau de bord avec progression de l'enfant
- ✅ Visualisation des 60 Hizb du Coran
- ✅ Système de points "Barakah"
- ✅ Classements (classe et général)
- ✅ Versets coraniques quotidiens
- ✅ Interface bilingue (FR/AR)

#### Pour les Enseignants 👨‍🏫
- ✅ Interface "Smart-Log" ultra-rapide
- ✅ Saisie des progrès en quelques secondes
- ✅ Gestion de l'assiduité et du comportement
- ✅ Vue d'ensemble de la classe
- ✅ Code de classe unique
- ✅ Mode hors-ligne avec synchronisation

#### Pour les Administrateurs 👔
- ✅ Gestion des utilisateurs
- ✅ Gestion des classes
- ✅ Validation des inscriptions
- ✅ Tableaux de bord statistiques
- ✅ Configuration du système

### 🛠️ Technologies Utilisées

**Frontend:**
- React 18 avec TypeScript
- Vite (build ultra-rapide)
- Tailwind CSS (design responsive)
- Zustand (gestion d'état)
- i18next (internationalisation)
- PWA (Progressive Web App)

**Backend:**
- Node.js avec Express
- TypeScript
- PostgreSQL
- JWT (authentification)
- Bcrypt (sécurité)

### 🚀 Pour Commencer

#### Option 1: Script automatique (Windows)

```powershell
.\start.ps1
```

ou

```cmd
start.bat
```

#### Option 2: Démarrage manuel

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run seed    # Première fois seulement
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

### 🔑 Comptes de Test

**Administrateur:**
- Email: `admin@qurandec.com`
- Mot de passe: `admin123`

**Enseignant:**
- Email: `teacher@qurandec.com`
- Mot de passe: `teacher123`

**Parent (inscription):**
1. Aller sur "Inscrire mon enfant"
2. Code de classe: `MOSQ-01`
3. Se connecter avec le numéro de téléphone fourni
4. Le code OTP apparaît dans les logs du backend (mode dev)

### 🎨 Design et Identité Visuelle

**Palette de couleurs:**
- Primaire: #357d7f (Vert d'eau)
- Secondaire: #D4AF37 (Or)
- Fond: #FEFBF6 (Blanc cassé)

**Typographies:**
- Français: Montserrat
- Arabe: Amiri
- Versets: Scheherazade New

### 📱 Progressive Web App (PWA)

L'application est installable sur mobile et desktop:
- ✅ Fonctionne hors-ligne
- ✅ Synchronisation automatique
- ✅ Notifications push (à configurer)
- ✅ Icônes d'application

### 🔐 Sécurité

- ✅ Authentification JWT
- ✅ Mots de passe hachés (bcrypt)
- ✅ Protection CSRF
- ✅ Validation des données
- ✅ Routes protégées par rôles

### 📊 Base de Données

Tables créées automatiquement:
- `users` - Utilisateurs (admin, enseignant, parent)
- `students` - Élèves
- `classes` - Classes
- `surahs` - Sourates du Coran
- `hizbs` - Divisions (60 Hizb)
- `verses` - Versets
- `progress` - Progrès quotidiens
- `point_transactions` - Historique des points
- `registration_requests` - Demandes d'inscription
- `otp_codes` - Codes de vérification

### 🎯 Prochaines Étapes

1. **Données Coraniques Complètes**
   - Importer les 114 sourates
   - Importer les 6236 versets
   - Utiliser un dataset comme Quran-db

2. **Service SMS**
   - Configurer un service SMS réel (Twilio, etc.)
   - Remplacer l'OTP de développement

3. **Personnalisation**
   - Ajouter le logo de votre mosquée
   - Personnaliser les couleurs si nécessaire
   - Ajouter des photos d'élèves

4. **Déploiement**
   - Suivre le guide DEPLOYMENT.md
   - Configurer HTTPS
   - Sauvegardes automatiques

### 📚 Documentation

- **README.md** - Documentation complète du projet
- **INSTALLATION.md** - Guide d'installation pas à pas
- **DEPLOYMENT.md** - Guide de déploiement en production

### 🐛 Dépannage

**Le backend ne démarre pas:**
- Vérifier que PostgreSQL est installé et démarré
- Vérifier les identifiants dans `backend/.env`
- Créer la base de données: `CREATE DATABASE quran_school;`

**Le frontend ne se connecte pas au backend:**
- Vérifier que le backend est démarré sur le port 5000
- Vérifier l'URL dans `.env`: `VITE_API_URL=http://localhost:5000/api`

**Erreur lors du seed:**
- S'assurer que la base de données existe
- Vérifier les permissions PostgreSQL

### 💡 Conseils

1. **Développement**: Utilisez `npm run dev` pour le hot-reload
2. **Production**: Construisez avec `npm run build`
3. **Tests**: Testez d'abord avec les comptes fournis
4. **Données**: Commencez petit, ajoutez quelques élèves de test
5. **Sauvegardes**: Exportez régulièrement votre base de données

### 🤝 Support

Pour toute question ou problème:
- Consultez la documentation dans le dossier
- Vérifiez les logs dans la console
- Examinez les erreurs dans les DevTools du navigateur

### 🎉 Félicitations !

Votre plateforme QuranDec est prête. Vous pouvez maintenant:
- Tester toutes les fonctionnalités
- Personnaliser selon vos besoins
- Ajouter de vraies données
- Déployer en production

**Qu'Allah bénisse ce projet et en fasse un moyen d'apprentissage du Noble Coran ! 🤲**

---

*Développé avec ❤️ pour faciliter l'enseignement coranique*
