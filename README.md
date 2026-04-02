# ResaEdulab — Système de réservation d'équipements

Application web de gestion des réservations d'équipements pour Edulab. Les utilisateurs parcourent le catalogue, créent des réservations multi-articles avec plages de dates, et reçoivent des confirmations par email. Les admins gèrent l'inventaire et suivent les prêts en cours.

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de données + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Styling | Tailwind CSS |
| Email | Resend |
| Déploiement | Vercel |
| Langage | TypeScript |

## Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:3000
```

## Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Base de données Supabase

### Schéma initial

Exécuter `supabase-schema.sql` dans le SQL Editor de Supabase pour créer les tables :

- **equipment** — catalogue d'équipements (nom, type, marque, modèle, statut, `parent_id` pour les accessoires)
- **profiles** — profils utilisateurs (email, nom, rôle `user` | `admin`)
- **reservations** — réservations avec dates et statut (`active` | `returned` | `cancelled`)
- **reservation_items** — items liés à chaque réservation

### Migrations

Après la création initiale, exécuter les migrations dans l'ordre :

| Fichier | Description |
|---|---|
| `scripts/migration-add-parent-id.sql` | Ajoute `parent_id` sur `equipment` pour le rattachement des accessoires (valises de transport, etc.) |

### Configuration Supabase

- Activer le provider Email dans Authentication
- Les policies RLS sont incluses dans le schéma SQL
- Activer `pg_cron` pour les rappels automatiques (ou utiliser Vercel Cron)

## Fonctionnalités principales

### Catalogue d'équipements
- Liste avec filtres en cascade (type, marque, statut)
- Tri alphabétique par colonne (ID, type, marque, statut)
- En-têtes de colonnes et filtres sticky au scroll
- Statut « en prêt » calculé en temps réel depuis les réservations actives
- Accessoires (valises de transport) groupés sous leur article parent

### Réservation
- Panier côté client (Zustand)
- Sélection de dates de début/fin
- Vérification de disponibilité côté serveur (empêche les doubles réservations)
- Ajout automatique des accessoires au panier
- Confirmation par email via Resend

### Administration
- Dashboard avec statistiques (total, en prêt, en retard)
- Gestion de l'inventaire (ajout, modification, suppression, import CSV)
- Rattachement d'accessoires via le champ « Équipement parent »
- Suivi de toutes les réservations et retours
- Gestion des utilisateurs et rôles

## Import de données

```bash
npx ts-node scripts/import-equipment.ts
```

Importe les équipements depuis un fichier Excel/CSV. Colonnes attendues : Nom, Equipement, Marque, Modèle, S/N, Date d'achat.

## Déploiement Vercel

- Connecter le repo GitHub → auto-deploy sur push `main`
- Ajouter toutes les variables d'environnement dans le dashboard Vercel
- Le fichier `vercel.json` configure le cron job pour les rappels de retour quotidiens
