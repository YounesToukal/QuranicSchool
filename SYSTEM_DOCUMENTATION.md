# QuranDec - Système de Gestion d'École Coranique

## Vue d'ensemble du système

QuranDec est une plateforme complète de gestion pour les écoles coraniques, conçue pour respecter l'identité sacrée de la mosquée et du Coran. Le système prend en charge deux types de classes avec des besoins pédagogiques distincts.

---

## Architecture Globale

### Structure Technique
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Authentification**: JWT + OTP (SMS/Phone)
- **Styling**: TailwindCSS

### Identité et Principes
- ✅ Interface propre et professionnelle
- ✅ Respect du lieu saint (mosquée)
- ✅ Pas d'émojis ni de décorations inappropriées
- ✅ Pas d'utilisation des versets coraniques comme décoration
- ✅ Fonctionnalité avant esthétique

---

## Types de Classes

### 1. حلقات الحفظ (Halaqat Al-Hifz) - Classes de Mémorisation

#### Objectif
Permettre aux étudiants de mémoriser et de retenir le Saint Coran.

#### Caractéristiques
- **Public cible**: Enfants et adultes capables de mémoriser
- **Méthode**: Mémorisation progressive page par page
- **Suivi**: Pages mémorisées et révisées
- **Système de points**: 
  - Points Barakah pour motivation
  - Bonus pour Hizb complet
  - Bonus pour assiduité
- **Classement**: Mensuel et total

#### Fonctionnalités Spécifiques
1. **Enregistrement quotidien**:
   - Pages mémorisées (90 points/page)
   - Pages révisées (50 points/page)
   - Présence (50 points)
   - Concentration (40/20/10 points selon niveau)

2. **Suivi de progression**:
   - Hizb actuel (1-60)
   - Sourate actuelle
   - Page actuelle
   - Total de points

3. **Interface enseignant**:
   - SmartLogInterface pour enregistrement rapide
   - Filtres par statut (non rempli, présent, absent)
   - Vue par classe

4. **Interface parent**:
   - Vue détaillée de chaque enfant
   - Historique de progression
   - Grille des Hizb complétés
   - Multi-enfants supporté

---

### 2. حلقات التلقين (Halaqat At-Talqin) - Classes de Récitation

#### Objectif
Enseigner la prononciation correcte et le Tajweed AVANT la mémorisation.

#### Caractéristiques
- **Public cible**: Petits enfants (4-8 ans), débutants, non-arabophones
- **Méthode**: Le professeur récite, les élèves répètent
- **Focus**: Écoute, imitation, prononciation correcte
- **Pas de points**: Adapté à l'âge des petits enfants

#### Fonctionnalités Spécifiques

1. **Devoirs hebdomadaires**:
   - Le professeur assigne une sourate par semaine
   - Notification envoyée aux parents
   - Versets spécifiques à préparer
   - Instructions pour les parents

2. **Enregistrement de progression**:
   - Sourate pratiquée
   - Versets pratiqués
   - **Qualité de prononciation** (Excellent/Bien/À améliorer)
   - **Qualité du Tajweed** (Excellent/Bien/À améliorer)
   - **Attention à l'écoute** (Élevé/Moyen/Faible)
   - **Précision de répétition** (Excellent/Bien/À améliorer)
   - Présence
   - Notes de l'enseignant

3. **Interface enseignant**:
   - TalqinTeacherInterface adapté aux petits
   - Création de devoirs individuels ou collectifs
   - Enregistrement simplifié de la progression
   - **Rapport imprimable** pour tous les élèves

4. **Interface parent**:
   - TalqinParentView avec guide complet
   - Vue des devoirs de la semaine
   - Progression récente détaillée
   - Instructions pour aider l'enfant à la maison
   - Pas de classement (inapproprié pour petits)

5. **Rapport imprimable**:
   - Vue d'ensemble de la classe
   - Statistiques par élève:
     * Nombre de séances
     * Taux de présence
     * Prononciation excellente (count)
     * Tajweed excellent (count)
     * Moyenne d'attention
     * Moyenne de précision
   - Format PDF optimisé pour impression
   - En arabe (dir="rtl")

---

## Modèle de Données

### Tables Communes

#### users
```sql
- id: SERIAL PRIMARY KEY
- role: VARCHAR(20) ['admin', 'teacher', 'parent']
- name: VARCHAR(100)
- email: VARCHAR(100) UNIQUE
- phone: VARCHAR(20) UNIQUE
- password_hash: VARCHAR(255)
- created_at, updated_at: TIMESTAMP
```

#### students
```sql
- id: SERIAL PRIMARY KEY
- first_name, last_name: VARCHAR(50)
- parent_id: INTEGER → users(id)
- class_id: INTEGER → classes(id)
- photo_url: VARCHAR(255)
- total_points: INTEGER (pour Hifz)
- monthly_points: INTEGER (pour Hifz)
- current_hizb: INTEGER (pour Hifz)
- current_surah: INTEGER
- current_page: INTEGER (pour Hifz)
- created_at, updated_at: TIMESTAMP
```

#### classes
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100)
- code: VARCHAR(20) UNIQUE
- class_type: VARCHAR(20) ['hifz', 'talqin'] ← NOUVEAU
- teacher_id: INTEGER → users(id)
- teacher_name: VARCHAR(100)
- created_at, updated_at: TIMESTAMP
```

### Tables Hifz

#### progress (Hifz)
```sql
- id: SERIAL PRIMARY KEY
- student_id: INTEGER → students(id)
- date: DATE
- pages_memorized: INTEGER
- pages_revised: INTEGER
- attendance: VARCHAR(20) ['present', 'absent', 'justified']
- concentration: VARCHAR(20) ['low', 'medium', 'high']
- points_earned: INTEGER
- notes: TEXT
- teacher_id: INTEGER → users(id)
- created_at: TIMESTAMP
```

#### point_transactions (Hifz)
```sql
- id: SERIAL PRIMARY KEY
- student_id: INTEGER → students(id)
- type: VARCHAR(50) ['memorization', 'revision', 'attendance', ...]
- points: INTEGER
- description: TEXT
- date: DATE
- created_at: TIMESTAMP
```

### Tables Talqin

#### weekly_assignments (Talqin)
```sql
- id: SERIAL PRIMARY KEY
- class_id: INTEGER → classes(id)
- student_id: INTEGER → students(id)
- week_start_date: DATE
- surah_id: INTEGER → surahs(id)
- verses_to_prepare: TEXT
- notes: TEXT
- status: VARCHAR(20) ['assigned', 'completed', 'pending']
- teacher_id: INTEGER → users(id)
- created_at, updated_at: TIMESTAMP
```

#### talqin_progress (Talqin)
```sql
- id: SERIAL PRIMARY KEY
- student_id: INTEGER → students(id)
- date: DATE
- surah_practiced: INTEGER → surahs(id)
- verses_practiced: TEXT
- pronunciation_quality: VARCHAR(20) ['excellent', 'good', 'needs_improvement']
- tajweed_quality: VARCHAR(20) ['excellent', 'good', 'needs_improvement']
- listening_attention: VARCHAR(20) ['high', 'medium', 'low']
- repetition_accuracy: VARCHAR(20) ['excellent', 'good', 'needs_improvement']
- attendance: VARCHAR(20) ['present', 'absent', 'justified']
- notes: TEXT
- teacher_id: INTEGER → users(id)
- created_at: TIMESTAMP
```

### Tables Référence Coran

#### surahs
```sql
- id: SERIAL PRIMARY KEY
- number: INTEGER UNIQUE (1-114)
- name: VARCHAR(100) (latin)
- name_arabic: VARCHAR(100)
- english_name: VARCHAR(100)
- total_verses: INTEGER
- revelation_type: VARCHAR(10) ['Meccan', 'Medinan']
- start_page, end_page: INTEGER
```

#### hizbs
```sql
- id: SERIAL PRIMARY KEY
- number: INTEGER UNIQUE (1-60)
- start_surah, start_verse: INTEGER
- end_surah, end_verse: INTEGER
```

---

## API Endpoints

### Authentification
```
POST   /api/auth/login              - Login (email/password ou username/code)
POST   /api/auth/request-otp        - Demander code OTP
POST   /api/auth/verify-otp         - Vérifier code OTP
POST   /api/auth/register           - Inscription parent
```

### Classes
```
GET    /api/classes                 - Liste toutes les classes
GET    /api/classes/public          - Classes publiques (pour inscription)
GET    /api/classes/:id             - Détails d'une classe
POST   /api/classes                 - Créer une classe (admin)
POST   /api/classes/:id/generate-code - Générer nouveau code
```

### Étudiants
```
GET    /api/students/:id            - Détails étudiant
GET    /api/students/parent/:id     - Étudiants d'un parent
GET    /api/students/class/:id      - Étudiants d'une classe
PUT    /api/students/:id            - Modifier étudiant
```

### Hifz - Progression
```
POST   /api/progress                - Enregistrer progression
GET    /api/progress/student/:id    - Progression d'un étudiant
PUT    /api/progress/:id            - Modifier progression
```

### Talqin - Devoirs
```
GET    /api/talqin/assignments/class/:classId        - Devoirs d'une classe
GET    /api/talqin/assignments/student/:studentId    - Devoirs d'un élève
POST   /api/talqin/assignments                       - Créer devoir individuel
POST   /api/talqin/assignments/bulk                  - Créer devoirs pour classe
PATCH  /api/talqin/assignments/:id/status            - Changer statut devoir
```

### Talqin - Progression
```
POST   /api/talqin/progress                          - Enregistrer progression Talqin
GET    /api/talqin/progress/student/:studentId       - Progression élève Talqin
GET    /api/talqin/report/class/:classId             - Rapport classe (imprimable)
```

### Classements (Hifz uniquement)
```
GET    /api/rankings/global         - Classement global
GET    /api/rankings/class/:id      - Classement par classe
```

### Admin
```
GET    /api/admin/stats/overview    - Statistiques générales
```

### Coran
```
GET    /api/quran/surahs            - Toutes les sourates
GET    /api/quran/hizbs             - Tous les Hizb
GET    /api/quran/surahs/:id/verses - Versets d'une sourate
```

---

## Composants Frontend

### Communs
- **Header**: Navigation principale
- **LanguageSwitcher**: Arabe/Français
- **LoadingSpinner**: Indicateur de chargement

### Hifz
- **SmartLogInterface**: Interface rapide pour professeur
- **HizbGrid**: Grille de progression des Hizb
- **PointsDisplay**: Affichage des points Barakah

### Talqin
- **TalqinTeacherInterface**: Interface professeur Talqin
  - Grille d'élèves
  - Formulaire de progression
  - Formulaire d'assignation
  - Génération de rapport PDF
  
- **TalqinParentView**: Vue parent Talqin
  - Devoirs de la semaine
  - Progression récente
  - Guide pour parents

### Pages
- **LandingPage**: Page d'accueil publique
- **LoginPage**: Connexion (OTP/Email/Username)
- **RegisterPage**: Inscription parent
- **TeacherDashboard**: Tableau de bord professeur (Hifz)
- **ParentDashboard**: Tableau de bord parent (adapté au type de classe)
- **AdminDashboard**: Administration et statistiques

---

## Flux de Travail

### Création d'une Classe Talqin

1. **Admin crée la classe**:
   ```json
   POST /api/classes
   {
     "name": "Talqin Petits 2024",
     "code": "MOSQ-21",
     "teacherName": "Sheikh Ahmed",
     "classType": "talqin"
   }
   ```

2. **Parents inscrivent leurs enfants** avec le code classe

3. **Admin approuve** les inscriptions

### Workflow Hebdomadaire (Talqin)

#### Lundi - Attribution des devoirs
```typescript
// Professeur assigne sourate Al-Fatiha à toute la classe
POST /api/talqin/assignments/bulk
{
  "classId": 1,
  "weekStartDate": "2026-02-23",
  "surahId": 1,  // Al-Fatiha
  "versesToPrepare": "1-7",
  "notes": "Écouter et répéter 3 fois par jour avec les parents"
}
```

#### Pendant la semaine - Parents voient le devoir
- Parents consultent TalqinParentView
- Voient la sourate assignée
- Lisent les instructions
- Aident l'enfant à pratiquer à la maison

#### Samedi - Enregistrement en classe
```typescript
// Pour chaque élève présent
POST /api/talqin/progress
{
  "studentId": 5,
  "date": "2026-02-28",
  "surahPracticed": 1,
  "versesPracticed": "1-7",
  "pronunciationQuality": "good",
  "tajweedQuality": "needs_improvement",
  "listeningAttention": "high",
  "repetitionAccuracy": "good",
  "attendance": "present",
  "notes": "Excellent participation, travail sur Ghunna"
}
```

#### Fin du mois - Rapport imprimable
```typescript
GET /api/talqin/report/class/1?startDate=2026-02-01&endDate=2026-02-28

// Génère rapport PDF avec:
// - Statistiques de présence
// - Qualité moyenne prononciation
// - Qualité moyenne Tajweed
// - Notes du professeur
```

### Workflow Quotidien (Hifz)

1. **Professeur ouvre SmartLogInterface**
2. **Filtrer par "non rempli"**
3. **Pour chaque élève**:
   - Marquer présence
   - Entrer pages mémorisées
   - Entrer pages révisées
   - Évaluer concentration
   - Ajouter notes
4. **Système calcule automatiquement** les points
5. **Parent voit progression** dans ParentDashboard

---

## Différences Clés entre Hifz et Talqin

| Aspect | Hifz (Mémorisation) | Talqin (Récitation) |
|--------|-------------------|-------------------|
| **Âge** | Tous âges | Petits enfants (4-8 ans) |
| **Objectif** | Mémoriser par cœur | Apprendre à réciter correctement |
| **Méthode** | Répétition jusqu'à mémorisation | Écoute et imitation du professeur |
| **Suivi** | Pages mémorisées/révisées | Qualité prononciation/Tajweed |
| **Motivation** | Points Barakah + Classements | Encouragements verbaux uniquement |
| **Devoirs** | Implicite (mémoriser pages suivantes) | Explicite (sourate assignée chaque semaine) |
| **Rapport** | Graphiques de progression | Tableau imprimable mensuel |
| **Interface** | SmartLogInterface (rapide) | TalqinTeacherInterface (détaillé) |
| **Parents** | Vue multi-enfants avec points | Vue par enfant avec devoirs |

---

## Système de Points (Hifz uniquement)

### Attribution des points
- **Mémorisation**: 90 points/page
- **Révision**: 50 points/page
- **Présence**: 50 points
- **Concentration élevée**: 40 points
- **Concentration moyenne**: 20 points
- **Concentration faible**: 10 points
- **Bonus Hizb**: 500 points (automatique à la fin d'un Hizb)

### Points mensuels vs totaux
- **Points mensuels**: Réinitialisés le 1er de chaque mois
- **Points totaux**: Cumulatifs sur toute l'année

### Classements
- Top 3 mensuel sur la landing page
- Classement complet dans l'interface parent
- Filtrable par classe

---

## Sécurité et Permissions

### Rôles
- **Admin**: Gestion complète
- **Teacher**: Gestion de ses classes uniquement
- **Parent**: Vue de ses enfants uniquement

### Authentification
- JWT tokens avec expiration
- OTP pour parents (pas d'email requis)
- Email/password pour professeurs et admin
- Username/code pour étudiants simples

---

## Internationalisation

### Langues supportées
- Français (fr)
- Arabe (ar)

### Fichiers de traduction
- `src/i18n/locales/fr.json`
- `src/i18n/locales/ar.json`

### Principes
- Terminologie coranique en arabe
- Interface en français/arabe selon préférence
- Respect de la direction RTL pour l'arabe

---

## Déploiement et Configuration

### Variables d'environnement

#### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quran_school
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Base de données
1. Créer base PostgreSQL
2. Exécuter `npm run seed` pour données initiales
3. Tables créées automatiquement au démarrage

### Démarrage
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
npm install
npm run dev
```

---

## Évolutions Futures Possibles

### Talqin
- [ ] Système de notifications SMS pour devoirs
- [ ] Enregistrement audio de la récitation des enfants
- [ ] Comparaison avec récitation correcte (AI)
- [ ] Progression visuelle pour motiver petits enfants
- [ ] Badge de réussite (sans points)

### Hifz
- [ ] Graphiques de progression avancés
- [ ] Prédiction de fin de mémorisation
- [ ] Système de révision espacée intelligent
- [ ] Export Excel des statistiques
- [ ] Application mobile native

### Général
- [ ] Système de messages professeur-parent
- [ ] Calendrier des événements
- [ ] Gestion des absences
- [ ] Photos de classe
- [ ] Multi-mosquées (SaaS)

---

## Conclusion

QuranDec est un système complet qui respecte les deux approches pédagogiques distinctes de l'enseignement coranique:

1. **Hifz** pour la mémorisation structurée avec motivation par points
2. **Talqin** pour l'apprentissage en douceur des petits enfants

L'architecture modulaire permet d'ajouter facilement de nouvelles fonctionnalités tout en maintenant la séparation claire entre les deux types de classes.

Le système respecte l'identité sacrée de la mosquée en évitant toute décoration inappropriée et en se concentrant sur la fonctionnalité et la clarté.

---

**Baraka Allahu fikum - بارك الله فيكم**
