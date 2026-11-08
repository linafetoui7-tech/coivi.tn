# Coivi.tn — Configuration Supabase

## 1. Présentation

Coivi.tn est un site de covoiturage permettant de proposer des trajets,
consulter les trajets disponibles et effectuer des réservations.

Le projet utilise :

- HTML
- CSS
- JavaScript
- Supabase
- Supabase Authentication
- Supabase Database
- Row Level Security (RLS)

---

## 2. Configuration Supabase

Nom du projet Supabase :

Coivi.tn

Les informations de connexion sont configurées dans :

supabase-client.js

Le projet utilise uniquement la clé publique Publishable de Supabase.

Aucune clé Secret ou Service Role n'est utilisée dans le navigateur.

---

## 3. Tables de la base de données

### rides

Cette table contient les trajets publiés.

Informations principales :

- departure
- destination
- departure_time
- available_seats
- price_per_passenger
- description
- driver_name
- is_available
- created_at

### reservations

Cette table contient les réservations des utilisateurs.

Informations principales :

- user_id
- ride_id
- seats_reserved
- total_price
- status
- created_at

Chaque réservation est liée à un utilisateur Supabase et à un trajet.

### user_roles

Cette table permet de gérer les rôles des utilisateurs.

Rôles utilisés :

- client
- admin

Le rôle admin permet d'accéder à l'interface d'administration.

---

## 4. Authentification

L'authentification est gérée avec Supabase Auth.

Fonctionnalités implémentées :

- Création d'un compte
- Confirmation de l'adresse e-mail
- Connexion
- Déconnexion
- Vérification de la session utilisateur
- Protection de l'espace administrateur

Pages concernées :

- signup.html
- login.html
- verification.html
- compte.html
- admin.html

---

## 5. Gestion des trajets

Les trajets sont enregistrés dans la table `rides`.

Un trajet contient notamment :

- Ville de départ
- Destination
- Date et heure
- Nombre de places
- Prix par passager
- Conducteur
- Description

Les trajets disponibles sont chargés depuis Supabase et affichés
dynamiquement sur le site.

---

## 6. Gestion des réservations

Un utilisateur connecté peut réserver un trajet disponible.

Lors d'une réservation, les informations suivantes sont enregistrées :

- Utilisateur
- Trajet
- Nombre de places réservées
- Prix total
- Statut

Les réservations de l'utilisateur sont affichées dans la page
`compte.html`.

---

## 7. Administration

La page `admin.html` est réservée aux administrateurs.

L'accès est vérifié grâce à la table `user_roles`.

L'administrateur peut :

- Consulter les trajets
- Consulter les réservations
- Modifier le statut d'une réservation

Statuts utilisés :

- pending
- confirmed
- cancelled

---

## 8. Sécurité RLS

Row Level Security (RLS) est activé sur les tables Supabase.

Les politiques permettent notamment :

- Aux visiteurs de consulter les trajets disponibles
- Aux utilisateurs connectés de consulter leurs propres réservations
- Aux utilisateurs de consulter leur propre rôle
- Aux administrateurs d'accéder aux données nécessaires à l'administration

RLS ne doit pas être désactivé.

---

## 9. Scripts SQL

Les scripts SQL du projet sont :

- supabase-setup.sql
- supabase-orders.sql
- supabase-admin.sql

Ils permettent de créer les tables, les politiques RLS et les permissions
nécessaires au fonctionnement du projet.

---

## 10. Test local

Le projet a été testé avec Live Server.

URL locale utilisée :

http://127.0.0.1:5500

Cette URL est configurée dans Supabase Authentication > URL Configuration.

---

## 11. Tests réalisés

Les tests suivants ont été effectués avec succès :

- Création d'un compte
- Réception de l'e-mail de confirmation
- Confirmation de l'adresse e-mail
- Connexion d'un utilisateur
- Affichage des informations du compte
- Publication d'un trajet
- Lecture des trajets depuis Supabase
- Réservation d'un trajet
- Enregistrement de la réservation dans Supabase
- Affichage de la réservation dans Mon compte
- Accès administrateur
- Affichage des trajets dans l'administration
- Affichage des réservations dans l'administration
- Modification du statut d'une réservation
- Vérification du nouveau statut dans Mon compte

---

## 12. Déploiement Vercel

Le site sera déployé sur Vercel.

Après le déploiement, l'URL Vercel devra être ajoutée dans :

Supabase > Authentication > URL Configuration

URL Vercel :

[https://coivi-tn-backup.vercel.app/](https://coivi-tn-backup.vercel.app/)