# CLAUDE.md — Edulab Equipment Reservation System

## Project Overview

Web application for managing equipment reservations at Edulab. Users can browse available equipment, create multi-item reservations with date ranges, and receive email confirmations. Admins manage inventory availability and monitor all active loans.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| ORM | Supabase JS client (no additional ORM) |
| Styling | Tailwind CSS |
| Email | Resend (via Supabase Edge Functions or Next.js API routes) |
| Deployment | Vercel |
| Language | TypeScript |

## Authentication & Authorization

- **Provider**: Supabase Auth — email/password only
- **Roles**: stored in `profiles.role` column
  - `user` — can browse equipment, create/cancel own reservations
  - `admin` — full access: manage inventory status, view all reservations, mark returns
- Multiple admins are supported; role is assigned directly in Supabase or via a dedicated admin UI page
- Route protection via Next.js middleware using Supabase session cookies

## Database Schema (Supabase / PostgreSQL)

### `equipment`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
nom             TEXT NOT NULL UNIQUE          -- original ID from Excel e.g. "AUD21001"
equipement      TEXT NOT NULL                 -- type e.g. "micro cravate"
marque          TEXT
modele          TEXT
serial_number   TEXT
purchase_date   DATE
status          TEXT NOT NULL DEFAULT 'available'
                -- values: 'available' | 'unavailable' | 'maintenance'
image_url       TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### `profiles`
```sql
id        UUID PRIMARY KEY REFERENCES auth.users(id)
email     TEXT NOT NULL
full_name TEXT
role      TEXT NOT NULL DEFAULT 'user'   -- 'user' | 'admin'
created_at TIMESTAMPTZ DEFAULT now()
```

### `reservations`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES profiles(id)
start_date    TIMESTAMPTZ NOT NULL
end_date      TIMESTAMPTZ NOT NULL
status        TEXT NOT NULL DEFAULT 'active'
              -- values: 'active' | 'returned' | 'cancelled'
notes         TEXT
created_at    TIMESTAMPTZ DEFAULT now()
```

### `reservation_items`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE
equipment_id    UUID REFERENCES equipment(id)
returned_at     TIMESTAMPTZ    -- null until item is physically returned
```

### Row Level Security (RLS)
- `equipment`: read by all authenticated users; write by admin only
- `profiles`: users read/update own row; admin reads all
- `reservations`: users read own; admin reads all; users insert own
- `reservation_items`: follows parent reservation permissions

## Application Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                  -- auth guard + nav
│   │   ├── dashboard/page.tsx          -- user home: active loans, quick actions
│   │   ├── equipment/
│   │   │   ├── page.tsx                -- browse + search + filter
│   │   │   └── [id]/page.tsx           -- product detail + availability calendar + book button
│   │   ├── reservations/
│   │   │   ├── page.tsx                -- user's reservation history
│   │   │   ├── new/page.tsx            -- cart → date picker → confirm flow
│   │   │   └── [id]/page.tsx           -- reservation detail
│   │   └── admin/
│   │       ├── layout.tsx              -- admin-only guard
│   │       ├── dashboard/page.tsx      -- stats: total items, on loan, overdue
│   │       ├── equipment/page.tsx      -- full inventory table + status toggle
│   │       ├── equipment/[id]/page.tsx -- edit equipment, change status
│   │       ├── reservations/page.tsx   -- all active/past reservations
│   │       └── users/page.tsx          -- user list + role management
├── components/
│   ├── ui/                             -- Button, Badge, Card, Modal, DatePicker, etc.
│   ├── equipment/
│   │   ├── EquipmentCard.tsx
│   │   ├── EquipmentGrid.tsx
│   │   └── AvailabilityCalendar.tsx
│   ├── reservations/
│   │   ├── ReservationCart.tsx
│   │   ├── ReservationSummary.tsx
│   │   └── ReservationStatusBadge.tsx
│   └── admin/
│       ├── StatsCards.tsx
│       └── ReservationTable.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   -- browser client
│   │   ├── server.ts                   -- server client (cookies)
│   │   └── middleware.ts
│   ├── email/
│   │   └── resend.ts                   -- sendConfirmation(), sendReminder()
│   └── utils.ts
├── hooks/
│   ├── useEquipment.ts
│   ├── useCart.ts                      -- in-memory cart (zustand or useState)
│   └── useReservations.ts
└── middleware.ts                       -- session refresh + route protection
```

## Key Features & Business Logic

### Equipment Availability
- An item is **available** if: `equipment.status = 'available'` AND no active `reservation_items` entry exists for it within the requested date range
- Admin can set `status` to `'unavailable'` or `'maintenance'` at any time, which blocks new reservations regardless of calendar
- Availability is checked server-side before confirming a reservation to prevent race conditions

### Reservation Flow (User)
1. Browse equipment catalog → add items to cart (client-side state)
2. Select start date & end date for the entire reservation
3. Review cart summary (items + duration)
4. Submit → server action checks real-time availability for each item
5. If all available: create `reservation` + `reservation_items` records atomically (Supabase transaction)
6. Trigger confirmation email via Resend
7. If any item unavailable: return error listing conflicting items; user adjusts

### Return Flow (Admin)
1. Admin views active reservations table
2. Marks individual items or entire reservation as returned
3. Updates `reservation_items.returned_at` and `reservations.status` accordingly

### Email Notifications
- **Confirmation**: sent immediately after successful reservation creation
  - Contains: list of reserved items, start/end dates, reservation ID
- **Return reminder**: sent 24h before `end_date`
  - Implemented via Supabase Edge Function with pg_cron, or Vercel Cron Job querying reservations due tomorrow

## Data Import

Initial data load from `Listing_stock_Edulab.xlsx` (450 rows):

```typescript
// scripts/import-equipment.ts
// Run once: npx ts-node scripts/import-equipment.ts
// Maps Excel columns: Nom → nom, Equipement → equipement, Marque → marque, 
// Modèle → modele, S/N → serial_number, Date d'achat → purchase_date
```

Use `xlsx` npm package to parse, then batch insert via Supabase client with `upsert` on `nom` column.

## UI Design Reference

Match the style from provided screenshots:
- **Color palette**: purple primary (`#6B21A8` / Tailwind `purple-800`), white cards, light gray background
- **Layout**: mobile-first, single-column cards
- **Status badges**: green "Available", orange "On Loan", red "Unavailable"
- **Equipment card**: image, status badge, ID, name, description, location, last service date
- **Admin dashboard**: stat cards with counts, recent activity feed, quick action buttons

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never exposed to client
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Development Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
npx ts-node scripts/import-equipment.ts   # one-time data import
```

## Supabase Setup Checklist

- [ ] Create project on supabase.com
- [ ] Run schema SQL (tables + RLS policies)
- [ ] Enable Email auth provider
- [ ] Configure SMTP or use Supabase built-in email for auth emails
- [ ] Enable pg_cron extension for reminder scheduling (or use Vercel Cron)
- [ ] Run equipment import script

## Vercel Deployment

- Connect GitHub repo → auto-deploy on push to `main`
- Add all env vars in Vercel dashboard
- Set up Vercel Cron Job in `vercel.json` for daily reminder emails:

```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 8 * * *"
  }]
}
```

## Out of Scope (v1)

- SSO / OAuth
- QR code scanning
- Equipment photo upload (image_url can be set manually)
- Fine/penalty system for late returns
- Multi-location support

## Charte graphique EduLAB

### 2. Palette de couleurs

#### Variables CSS — à copier dans `:root`

```css
:root {
  /* --- Couleurs principales --- */
  --color-primary:    #00B4C8;   /* Teal cyan — identifiant fort, liens, titres, CTA */
  --color-dark:       #1A2E4A;   /* Bleu nuit — fonds sombres, textes sur clair */
  --color-accent:     #FF6B35;   /* Orange — CTA secondaires, badges, alertes */

  /* --- Neutres --- */
  --color-bg:         #FFFFFF;   /* Fond principal */
  --color-surface:    #F5F7FA;   /* Fond de carte / section légèrement tonée */
  --color-border:     #E0E6ED;   /* Bordures, séparateurs */
  --color-text:       #1C1C2E;   /* Corps de texte principal */
  --color-muted:      #6B7A8D;   /* Texte secondaire, légendes, métadonnées */

  /* --- États sémantiques --- */
  --color-success:    #00C896;   /* Validation, confirmation */
  --color-warning:    #FFAA00;   /* Attention, en attente */
  --color-error:      #E84040;   /* Erreur, critique */
  --color-info:       #00B4C8;   /* Information contextuelle (= primary) */
}
```

#### Tableau de référence

| Token | Hex | Usage principal | Ne pas utiliser pour |
|---|---|---|---|
| `--color-primary` | `#00B4C8` | Titres, liens, barres nav, icônes actifs | Corps de texte courant |
| `--color-dark` | `#1A2E4A` | Fonds sombres (hero, footer), titres forts | Petits textes sur fond clair |
| `--color-accent` | `#FF6B35` | CTA alternatifs, badges, numéros, pastilles | Succès, validation |
| `--color-bg` | `#FFFFFF` | Fond de page et de carte | — |
| `--color-surface` | `#F5F7FA` | Sections alternées, fonds de formulaires | Contenu principal (trop terne) |
| `--color-text` | `#1C1C2E` | Tout texte courant | Fonds colorés directs |
| `--color-muted` | `#6B7A8D` | Légendes, dates, auteurs | Titres, CTA |
| `--color-success` | `#00C896` | Feedback positif | Danger, avertissement |
| `--color-warning` | `#FFAA00` | Attention requise | Erreur critique |
| `--color-error` | `#E84040` | Erreur, blocage | Information neutre |

#### Règle de distribution (60-30-10)

```
60% → Neutres (#FFFFFF, #F5F7FA) — fond et zones de lecture
30% → Primary (#00B4C8) + Dark (#1A2E4A) — structure, titres, nav
10% → Accent (#FF6B35) + couleurs sémantiques — focus, CTA, badges
```

---

### 3. Typographie

#### Stack recommandée

```css
:root {
  --font-heading: 'Poppins', 'Nunito', system-ui, sans-serif;
  --font-body:    'Open Sans', 'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
}
```

> **Google Fonts CDN** :
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Open+Sans:wght@400;500&display=swap" rel="stylesheet">
> ```

#### Échelle typographique

```css
:root {
  --text-xs:   0.75rem;   /*  12px — badges, labels */
  --text-sm:   0.875rem;  /*  14px — légendes, métadonnées */
  --text-base: 1rem;      /*  16px — corps de texte */
  --text-lg:   1.125rem;  /*  18px — lead, intro */
  --text-xl:   1.25rem;   /*  20px — H4, sous-titre carte */
  --text-2xl:  1.5rem;    /*  24px — H3, titre section */
  --text-3xl:  1.875rem;  /*  30px — H2 */
  --text-4xl:  2.25rem;   /*  36px — H1 interne */
  --text-hero: 3rem;      /*  48px — titre hero page d'accueil */
}
```

#### Hiérarchie & style

| Niveau | Font | Poids | Couleur par défaut | Casse |
|---|---|---|---|---|
| Hero | Poppins | 700 | `--color-bg` (sur fond dark) | Normal ou Majuscule |
| H1 | Poppins | 700 | `--color-dark` | Normal |
| H2 | Poppins | 600 | `--color-dark` | **minuscules intentionnelles** ← signature stylistique |
| H3 | Poppins | 600 | `--color-primary` | minuscules |
| Corps | Open Sans | 400 | `--color-text` | Normal |
| CTA primaire | Poppins | 600 | `--color-bg` | MAJUSCULES |
| CTA secondaire | Open Sans | 500 | `--color-primary` | minuscules |
| Légende | Open Sans | 400 | `--color-muted` | Normal |

> **Signature stylistique clé** : les H2 de section en minuscules créent un effet de proximité et brisent le formalisme sans sacrifier la lisibilité. À conserver dans les déclinaisons.

---

### 4. Espacements & Layout

#### Système d'espacement (base 8px)

```css
:root {
  --space-1:  0.25rem;  /*  4px */
  --space-2:  0.5rem;   /*  8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px — padding de section */
}
```

#### Conteneurs

```css
:root {
  --container-sm:  640px;
  --container-md:  768px;
  --container-lg:  1024px;
  --container-xl:  1200px;  /* ← largeur principale */
  --container-pad: 1.5rem;  /* padding horizontal sur mobile */
}
```

#### Grilles standard

| Usage | Colonnes | Gap | Notes |
|---|---|---|---|
| Cartes formations/services | 3 | 32px | Passe à 2 sous 1024px, 1 sous 640px |
| Section 2 colonnes (texte + image) | 2 (60/40) | 48px | Image à droite sur desktop |
| Footer liens | 4 | 24px | Passe à 2 sous 768px |
| Hero | 1 (centré) | — | Max-width 800px, texte centré |

#### Coins arrondis

```css
:root {
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-pill: 9999px;  /* Boutons pill */
}
```

---

### 5. Composants

#### 5.1 — Boutons

```css
/* Bouton CTA primaire */
.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn-primary:hover {
  background: var(--color-dark);
  transform: translateY(-1px);
}

/* Bouton CTA secondaire */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--text-base);
  text-transform: lowercase;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-pill);
  border: 2px solid var(--color-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: var(--color-primary);
  color: #ffffff;
}

/* Bouton accent */
.btn-accent {
  background: var(--color-accent);
  color: #ffffff;
  /* Même structure que btn-primary */
}
```

#### 5.2 — Cartes

```css
.card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-8);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(0,180,200,0.12);
  transform: translateY(-2px);
}
.card-title {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: lowercase;   /* ← signature */
  font-size: var(--text-xl);
  margin-bottom: var(--space-3);
}
.card-body {
  color: var(--color-text);
  font-size: var(--text-base);
  line-height: 1.6;
}
.card-cta {
  margin-top: var(--space-6);
}
```

#### 5.3 — Header

Structure HTML recommandée :

```html
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo">
      <img src="logo.svg" alt="[Nom du site]" />
    </a>
    <nav class="main-nav">
      <ul>
        <li><a href="/about">À propos</a></li>
        <!-- ... -->
      </ul>
    </nav>
    <a href="/contact" class="btn-primary">Contact</a>
  </div>
</header>
```

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.header-inner {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-4) var(--container-pad);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}
.main-nav a {
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: color 0.15s, background 0.15s;
}
.main-nav a:hover,
.main-nav a[aria-current="page"] {
  color: var(--color-primary);
  background: rgba(0,180,200,0.06);
}
```

#### 5.4 — Section Hero

```css
.hero {
  background: var(--color-dark);
  color: #ffffff;
  padding: var(--space-24) var(--container-pad);
  text-align: center;
}
.hero-title {
  font-family: var(--font-heading);
  font-size: var(--text-hero);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: var(--space-6);
}
.hero-subtitle {
  font-size: var(--text-lg);
  color: rgba(255,255,255,0.75);
  max-width: 640px;
  margin: 0 auto var(--space-8);
  line-height: 1.6;
}
```

#### 5.5 — Sections alternées

Alternance blanc/gris clair entre les grandes sections de page :

```css
.section { padding: var(--space-24) var(--container-pad); }
.section--light { background: var(--color-bg); }
.section--toned { background: var(--color-surface); }
.section--dark  { background: var(--color-dark); color: #ffffff; }

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: 600;
  color: var(--color-dark);
  text-transform: lowercase;   /* ← signature stylistique */
  margin-bottom: var(--space-4);
}
.section--dark .section-title { color: #ffffff; }
```

#### 5.6 — Footer

```css
.site-footer {
  background: var(--color-dark);
  color: rgba(255,255,255,0.75);
  padding: var(--space-16) var(--container-pad) var(--space-8);
}
.footer-logo { margin-bottom: var(--space-8); }
.footer-nav a {
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color 0.15s;
}
.footer-nav a:hover { color: var(--color-primary); }
.footer-newsletter {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  margin-top: var(--space-12);
}
```

#### 5.7 — Badges / Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge--primary { background: rgba(0,180,200,0.12); color: var(--color-primary); }
.badge--accent  { background: rgba(255,107,53,0.12); color: var(--color-accent); }
.badge--success { background: rgba(0,200,150,0.12); color: var(--color-success); }
.badge--muted   { background: var(--color-surface);  color: var(--color-muted); }
```

---

### 6. Structure de page type

```
┌──────────────────────────────────────────┐
│ HEADER sticky (fond blanc, logo + nav)   │
├──────────────────────────────────────────┤
│ HERO (fond --color-dark)                 │
│   Titre fort + sous-titre + CTA          │
├──────────────────────────────────────────┤
│ SECTION 1 — fond blanc                   │
│   Grille 3 cartes (services/modules)     │
├──────────────────────────────────────────┤
│ SECTION 2 — fond --color-surface         │
│   2 colonnes : texte + image             │
├──────────────────────────────────────────┤
│ SECTION 3 — fond blanc                   │
│   Témoignages ou chiffres clés           │
├──────────────────────────────────────────┤
│ SECTION CTA — fond --color-primary       │
│   Titre + bouton (fond blanc, texte pri) │
├──────────────────────────────────────────┤
│ FOOTER (fond --color-dark)               │
│   Logo + nav + réseaux + newsletter      │
└──────────────────────────────────────────┘
```

---

### 7. Ton éditorial (découplé du contenu)

Ces règles s'appliquent indépendamment du domaine du site :

| Règle | Description |
|---|---|
| **Vouvoiement** | "vos besoins", "votre projet", "vous choisissez" |
| **Phrases courtes** | Paragraphes ≤ 3 phrases dans les sections visuelles |
| **Verbes d'action** | "Découvrir", "Rejoindre", "Expérimenter", "Innover" (adapter au domaine) |
| **Titres en minuscules** | Sections en minuscules intentionnelles = marque de style |
| **CTAs en MAJUSCULES** | Boutons principaux tout en majuscules pour le contraste |
| **Pas de jargon** | Termes simples, bénéfices concrets avant les caractéristiques |

---

### 8. Accessibilité

| Critère | Règle |
|---|---|
| **Contraste texte** | Minimum 4.5:1 (WCAG AA) pour tout texte normal |
| **Focus visible** | `outline: 2px solid var(--color-primary); outline-offset: 2px` sur tous les éléments interactifs |
| **Alt text** | Toutes les images décoratives : `alt=""` ; images informatives : description courte |
| **Navigation clavier** | Tous les liens et boutons doivent être accessibles au clavier dans l'ordre DOM |
| **Taille de cible** | Minimum 44×44px pour tout élément cliquable sur mobile |

```css
/* Focus global */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

### 9. Responsive — Breakpoints

```css
/* Mobile first */
/* Base : ≤ 639px */

@media (min-width: 640px)  { /* sm  — tablette portrait */ }
@media (min-width: 768px)  { /* md  — tablette paysage */ }
@media (min-width: 1024px) { /* lg  — desktop */ }
@media (min-width: 1280px) { /* xl  — large desktop */ }
```

Règles de comportement :

| Composant | Mobile | Tablette | Desktop |
|---|---|---|---|
| Navigation | Menu hamburger | Menu hamburger | Nav horizontale |
| Grille cartes | 1 colonne | 2 colonnes | 3 colonnes |
| Section 2 colonnes | 1 colonne (image en bas) | 2 colonnes | 2 colonnes |
| Taille hero title | `2rem` | `2.5rem` | `3rem` |
| Padding section | `3rem 1.5rem` | `4rem 2rem` | `6rem auto` |

---

##Evolution du CLAUDE.md

A chaque fois que l'utilisateur donne des instructions explicitement différentes de ce qui est contenu dans ce document, adapte ce document

