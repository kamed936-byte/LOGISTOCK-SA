<<<<<<< HEAD
# LogiStock SA : application de gestion intégrée

Application web de gestion (stocks, clients, ventes, tableau de bord) du projet fil rouge.
**État actuel** : les 7 fonctions du cahier des charges (F1 à F7) : authentification / RBAC, produits, mouvements, clients, ventes avec facture PDF, alertes et tableau de bord KPI.

| Couche | Technologie |
|---|---|
| Interface web | Angular 18 (TypeScript), compilée dans Docker puis servie par Nginx |
| API REST | Java 21, Spring Boot 3.3, Spring Security (JWT), JDBC |
| Base de données | PostgreSQL 16 (scripts dans `db/`) |
| Déploiement | Docker et Docker Compose (3 services) |

## Équipe (Groupe 3)

| Membre | Rôle |
|---|---|
| Anthioumana Boiguile | Product Owner |
| Ahmad Keita | Scrum Master |
| Abdoulaye Sanogo | Développeur |
| Mariam Show | Développeuse |
| Mohamed Dramé | Développeur |
| Safiatou Sanogo | Développeuse |

Le Product Owner et le Scrum Master développent aussi, comme le prévoit le sujet.

## Démarrage rapide (1 clic)

1. Installez **Docker Desktop** (une seule fois) et lancez-le : <https://www.docker.com>
2. Dézippez le projet.
3. **Windows** : double-cliquez sur `start.bat`. **Mac / Linux** : exécutez `./start.sh`.
4. Le navigateur s'ouvre sur <http://localhost:8081> : connectez-vous avec un compte de démonstration (ci-dessous).

> Le premier démarrage compile l'interface Angular : **Internet est nécessaire** et cela prend plusieurs minutes. Les suivants sont rapides.

Pour arrêter : `stop.bat` (Windows) ou `./stop.sh` (Mac / Linux).

## Lancer l'application (détail)

Prérequis : Docker et Docker Compose.

```bash
docker compose up -d --build
```

- Interface web : <http://localhost:8081>
- API REST : <http://localhost:8080/api>
- Documentation de l'API (Swagger) : <http://localhost:8080/swagger-ui.html>

Le premier démarrage télécharge les images et compile l'API (quelques minutes, connexion nécessaire).
Les démarrages suivants sont rapides. Pour repartir d'une base vide : `docker compose down -v`.

## Comptes de démonstration

Mot de passe de tous les comptes : `Passw0rd!`

| Rôle | E-mail |
|---|---|
| Administrateur | admin@logistock.test |
| Gestionnaire de stock | stock@logistock.test |
| Commercial | vente@logistock.test |

À supprimer ou à changer avant toute mise en ligne (ainsi que `JWT_SECRET` et `DB_PASSWORD`, voir plus bas).

## Droits par rôle (RBAC)

Les droits sont contrôlés côté serveur, sur chaque endpoint (`@PreAuthorize`).

| Fonctionnalité | Administrateur | Gestionnaire de stock | Commercial |
|---|---|---|---|
| Comptes et rôles | oui | non | non |
| Produits et catégories : lecture | oui | oui | oui |
| Produits et catégories : écriture | oui | oui | non |
| Mouvements de stock | oui | oui | non |
| Alertes de stock | oui | oui | oui |
| Tableau de bord KPI (F7) | oui | oui | oui |
| Clients (F4) | oui | non | oui |
| Ventes et factures PDF (F5) | oui | non | oui |

## Endpoints de l'API

| Méthode et chemin | Rôles | Rôle de l'endpoint |
|---|---|---|
| `POST /api/auth/login` | public | Connexion, renvoie un jeton JWT |
| `GET /api/auth/me` | tous | Utilisateur connecté |
| `GET /api/roles` | admin | Liste des rôles |
| `GET POST /api/utilisateurs` | admin | Lister, créer un compte |
| `PUT /api/utilisateurs/{id}` | admin | Modifier nom, rôle, statut actif |
| `PUT /api/utilisateurs/{id}/mot-de-passe` | admin | Changer un mot de passe |
| `GET POST /api/categories` | lecture : tous, écriture : admin et gestionnaire | Catégories |
| `PUT DELETE /api/categories/{id}` | admin, gestionnaire | Renommer, supprimer (refusé si elle contient des produits) |
| `GET /api/produits?q=&categorie=` | tous | Recherche et filtre |
| `POST PUT DELETE /api/produits` | admin, gestionnaire | Gérer les produits |
| `GET POST /api/mouvements` | admin, gestionnaire | Historique, nouvelle entrée ou sortie |
| `GET /api/alertes` | tous | Produits en rupture ou sous leur seuil |
| `GET /api/kpi` | tous | CA du jour et du mois, comparaison avec le mois précédent, valeur du stock, alertes, CA par jour, produits les plus vendus, mouvements de la semaine |
| `GET POST /api/clients` | admin, commercial | Recherche (`?q=`), création |
| `GET PUT DELETE /api/clients/{id}` | admin, commercial | Fiche, modification, suppression (refusée si le client a des commandes) |
| `GET /api/commandes?statut=&client=` | admin, commercial | Liste des ventes |
| `POST /api/commandes` | admin, commercial | Crée un brouillon (prix lus en base) |
| `GET PUT /api/commandes/{id}` | admin, commercial | Détail, modification d'un brouillon |
| `POST /api/commandes/{id}/valider` | admin, commercial | Valide : sorties de stock + facture |
| `POST /api/commandes/{id}/annuler` | admin, commercial | Annule un brouillon |
| `GET /api/commandes/{id}/facture` | admin, commercial | Facture PDF d'une vente validée |

Toutes les routes sauf la connexion demandent l'en-tête `Authorization: Bearer <jeton>`.
Dans Swagger, utilisez le bouton « Authorize » avec le jeton reçu au login.

## Règles de gestion appliquées

- Le stock ne peut jamais devenir négatif : une sortie trop grande est refusée (déclencheur SQL).
- Chaque mouvement est horodaté, rattaché à son auteur, et ne peut être ni modifié ni supprimé.
- La quantité en stock ne se modifie que par les mouvements.
- Un produit qui a un historique ne peut pas être supprimé ; une catégorie non vide non plus.
- Une vente est une commande : BROUILLON (modifiable), puis VALIDEE (stock diminué, facture créée) ou ANNULEE.
- La validation est refusée si le stock est insuffisant ; rien n'est alors modifié (transaction).
- Le prix de chaque ligne est celui du produit au moment de la vente, lu par le serveur.
- Une facture est numérotée `FAC-AAAA-00000`, unique, et liée à une seule vente.
- Un client qui a des commandes ne peut pas être supprimé.
- Le chiffre d'affaires ne compte que les ventes validées (ni brouillons, ni ventes annulées).
- Un compte désactivé perd l'accès immédiatement ; un administrateur ne peut pas désactiver son propre compte.
- Mots de passe hachés en BCrypt, requêtes SQL paramétrées, jetons JWT signés (expiration : 8 h).

## Tests

```bash
cd backend
mvn test
```

Les tests actuels couvrent le jeton JWT (valide, falsifié, mauvais secret, expiré), la correspondance des rôles, le format des montants des factures et le calcul de la variation mensuelle du chiffre d'affaires.
Les règles de vente (refus si stock insuffisant) sont testées au niveau SQL (fonction `valider_commande`).

## Configuration

Variables d'environnement lues par `docker-compose.yml` (à mettre dans un fichier `.env`, non versionné) :

| Variable | Défaut (développement) |
|---|---|
| `DB_USER` | logistock |
| `DB_PASSWORD` | logistock_dev |
| `JWT_SECRET` | secret de développement (32 caractères minimum) |

## Organisation du projet

```
logistock/
├── docker-compose.yml     lance les 3 services (base, API, site)
├── start.bat / start.sh   lancement en 1 clic (Windows / Mac-Linux)
├── stop.bat / stop.sh     arrêt
├── README.md
├── db/                    base de données
│   ├── 01_schema.sql        tables, règles métier, vues
│   └── 02_donnees_demo.sql  rôles, comptes et données de démonstration
├── backend/               API Java (Spring Boot)
│   ├── pom.xml, Dockerfile
│   └── src/main/java/com/logistock/
│       ├── security/        JWT, rôles, filtre d'authentification
│       ├── auth/            connexion
│       ├── admin/           comptes utilisateurs
│       ├── catalogue/       produits et catégories
│       ├── stock/           mouvements et alertes
│       ├── ventes/          clients, commandes/ventes, facture PDF
│       ├── kpi/             tableau de bord
│       └── common/          gestion des erreurs
└── frontend/              interface web
    ├── Dockerfile, nginx.conf
    └── src/                 application Angular
        ├── styles.css       palette bleu / blanc / orange
        └── app/
            ├── core/        API, session, intercepteur JWT, gardes de rôle
            └── pages/       un composant par écran
```
=======
# LOGISTOCK-SA
App web de gestion simple de vente
>>>>>>> ca7dddf0979da88520c27052b0eed369bf87cb0e
