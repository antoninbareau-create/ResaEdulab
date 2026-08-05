# Manuel d'utilisation — ResaEdulab

Application de réservation du matériel de l'Edulab. Ce manuel couvre les deux profils d'utilisation : **enseignant emprunteur** et **administrateur Edulab**.

- Adresse de l'application : voir affichette à l'Edulab ou demander à un administrateur.
- Pré-requis : un navigateur récent (Chrome, Firefox, Edge, Safari) et une adresse email valide.

---

## Partie 1 — Enseignant emprunteur

### 1.1 Créer un compte et se connecter

1. Ouvrir l'application puis cliquer sur **« S'inscrire »**.
2. Renseigner email, nom complet et mot de passe.
3. Confirmer l'email (un lien est envoyé par Supabase à l'adresse fournie).
4. Revenir sur la page **« Se connecter »** et saisir email + mot de passe.

Si l'email de confirmation n'arrive pas, vérifier les spams. En dernier recours, demander à un administrateur de valider le compte.

### 1.2 Le tableau de bord

Après connexion, la page d'accueil affiche :

- Un message d'accueil personnalisé avec le prénom du compte.
- Deux raccourcis : **Parcourir les équipements** et **Nouvelle réservation** (finaliser le panier en cours).
- La liste des réservations actives de l'utilisateur, triées par date de fin la plus proche.

### 1.3 Parcourir le catalogue

Cliquer sur **« Équipements »** dans la navigation. Le tableau présente l'ensemble du matériel disponible à l'Edulab.

**Filtres en cascade.** Trois listes déroulantes en haut de page :
- **Type** (micro cravate, caméra, trépied…)
- **Marque / Modèle**
- **Statut** (disponible, en prêt, en maintenance, indisponible)

Les filtres se mettent à jour mutuellement : choisir un type restreint les marques affichées à celles qui existent pour ce type, et inversement. Un bouton **« Réinitialiser »** efface tous les filtres.

**Tri des colonnes.** Cliquer sur un en-tête de colonne (ID, Type, Marque/Modèle, Statut) trie le tableau. Re-cliquer inverse le sens.

**Statut « en prêt ».** Calculé en temps réel à partir des réservations actives — un article peut être marqué **« disponible »** dans l'inventaire admin mais apparaître **« en prêt »** s'il est actuellement emprunté.

**Accessoires.** Certains articles (par exemple les valises de transport) sont rattachés à un article principal et apparaissent groupés dessous. Les ajouter au panier ajoute automatiquement les accessoires liés.

### 1.4 Préparer un panier

Sur la page d'un équipement, cliquer sur **« Ajouter au panier »**. Le panier est conservé sur l'appareil en cours et reste accessible depuis la barre de navigation.

Pour retirer un article : revenir sur sa fiche et cliquer sur **« Retirer du panier »**, ou ouvrir la page **Nouvelle réservation** pour gérer le contenu.

### 1.5 Créer une réservation

Depuis le panier, cliquer sur **« Nouvelle réservation »**.

1. Choisir une **date de début** (au plus tôt aujourd'hui) et une **date de fin**.
2. Optionnel : ajouter des **notes** (contexte pédagogique, lieu, classe concernée).
3. Cliquer sur **« Confirmer »**.

**En cas de conflit.** Si un ou plusieurs articles sont déjà réservés sur les dates demandées, l'application bloque la réservation et affiche une fenêtre détaillant pour chaque article :
- le nom et l'email de l'emprunteur actuel,
- la plage de dates qui pose conflit,
- une mention si la réservation en cours est **en retard**.

Adapter les dates ou retirer l'article du panier, puis re-confirmer.

**Confirmation.** Si tout est disponible, la réservation est enregistrée et un **email de confirmation** est envoyé par Resend, listant les articles et les dates.

### 1.6 Suivre ses réservations

Page **« Mes réservations »** : liste de toutes les réservations passées et actives de l'utilisateur, avec leur statut.

Statuts possibles :
- **Active** — réservation en cours ou à venir.
- **Returned** — matériel rendu à l'Edulab.
- **Cancelled** — réservation annulée avant retrait.

Cliquer sur une ligne ouvre le détail avec la liste précise des articles et leurs dates de retour individuelles (un article peut être rendu avant la fin théorique de la réservation).

### 1.7 Profil

Page **« Profil »** : voir et modifier son nom complet. L'email n'est pas modifiable depuis l'interface (procéder via Supabase ou demander à un administrateur).

---

## Partie 2 — Administrateur Edulab

L'accès admin nécessite que `profiles.role = 'admin'` dans la base. Cette valeur est posée par un administrateur existant depuis la page **Utilisateurs**, ou directement dans Supabase pour le premier compte admin.

### 2.1 Tableau de bord admin

Page **« Admin → Tableau de bord »** : cinq tuiles cliquables résumant l'état du parc.

| Tuile | Définition | Clic mène vers |
|---|---|---|
| Total équipements | Nombre total d'articles dans l'inventaire | Inventaire complet |
| Disponibles | `status = available` ET non actuellement en prêt | Inventaire filtré sur disponibles |
| En prêt | Articles actuellement empruntés (réservation active dont la date de début est passée et `returned_at` est vide) | Inventaire filtré sur en prêt |
| Réservations actives | Réservations dont le statut est `active` | Liste des réservations actives |
| En retard | Réservations actives dont la date de fin est dépassée | Page dédiée aux retards |

En dessous, un tableau **« Réservations récentes actives »** liste les cinq dernières créées avec l'emprunteur et le nombre d'articles.

### 2.2 Gérer l'inventaire

Page **« Admin → Équipements »**.

**Ajouter un équipement.** Bouton **« Nouvel équipement »** → formulaire avec :
- **Nom (ID)** — identifiant unique (ex. `AUD21001`). Obligatoire.
- **Type** — micro, caméra, trépied… (champ libre, mais réutiliser les types existants pour conserver les filtres propres).
- **Marque**, **Modèle**, **Numéro de série**, **Date d'achat**.
- **Statut** — `available`, `unavailable`, `maintenance`.
- **Équipement parent** — pour rattacher un accessoire (par exemple une valise) à un article principal. Laisser vide pour un article autonome.
- **URL d'image** — facultatif, lien direct vers une photo.

**Modifier ou supprimer.** Cliquer sur une ligne ouvre la fiche d'édition. La suppression efface l'article et détache automatiquement ses accessoires (`parent_id` repassé à null).

**Import en masse.** Script `npx ts-node scripts/import-equipment.ts` qui lit un fichier Excel/CSV et fait un `upsert` sur la colonne `nom`. Colonnes attendues : `Nom`, `Equipement`, `Marque`, `Modèle`, `S/N`, `Date d'achat`. Utile pour la mise en service initiale ou les arrivages groupés.

### 2.3 Réservations et retours

Page **« Admin → Réservations »** : table de toutes les réservations (filtrables par statut).

**Traiter un retour.** Ouvrir une réservation active. Deux possibilités :
- **Marquer un article comme rendu** — utile quand le matériel revient en plusieurs fois. Renseigne `reservation_items.returned_at`.
- **Marquer toute la réservation comme rendue** — passe `reservations.status = 'returned'` et renseigne `returned_at` sur tous les articles non encore rendus.

**Annuler une réservation.** Passe `status = 'cancelled'`. À utiliser pour les retraits non effectués (l'utilisateur a annulé son projet ou ne s'est pas présenté). Le matériel redevient disponible immédiatement.

### 2.4 Suivre les retards

Page **« Admin → En retard »** : liste des réservations dont `end_date` est dépassée et qui sont encore `active`. Sert de feuille de route pour les relances.

Un job quotidien (Vercel Cron, fichier `vercel.json`) envoie automatiquement un **email de rappel** aux emprunteurs 24h avant la date de fin théorique.

### 2.5 Gérer les utilisateurs

Page **« Admin → Utilisateurs »** : liste des comptes existants avec rôle modifiable.

- Passer un utilisateur à **admin** lui ouvre toutes les pages d'administration au prochain chargement.
- Passer un admin à **user** lui retire l'accès admin (la route est protégée côté serveur par le middleware Next.js).

Aucune suppression de compte depuis l'interface — procéder via la console Supabase si nécessaire.

---

## Annexe — FAQ rapide

**Je ne reçois pas mes emails de confirmation.**
Vérifier les spams. L'expéditeur est l'adresse Resend configurée dans l'environnement. Si plusieurs utilisateurs sont concernés, vérifier côté admin la clé `RESEND_API_KEY` dans Vercel et les logs Resend.

**Un article apparaît « en prêt » alors que je l'ai sous les yeux à l'Edulab.**
Une réservation active existe en base avec un `reservation_items.returned_at` vide. Aller dans **Admin → Réservations**, trouver la réservation et marquer l'article comme rendu.

**Comment éviter qu'un article soit réservable temporairement (panne, maintenance) ?**
Passer son `status` à `maintenance` ou `unavailable` dans la fiche admin. Le calcul de disponibilité du catalogue le retirera des articles réservables sans toucher aux réservations existantes.

**L'application m'a déconnecté en plein remplissage de panier.**
La session Supabase a expiré. Le panier est conservé dans le navigateur — se reconnecter et finaliser. Si le panier semble vide, il a été créé sur un autre appareil ou navigateur.

**Comment ajouter un nouveau type d'équipement (catégorie qui n'existait pas) ?**
Le champ `equipement` est libre. Le premier article créé avec une nouvelle valeur fait apparaître ce type dans les filtres du catalogue automatiquement.
