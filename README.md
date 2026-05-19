# Marketplace Microservices — README

> Architecture microservices e-commerce · Node.js · gRPC · Kafka · REST · GraphQL

---

## Table des matières

1. [Description du projet](#description-du-projet)
2. [Architecture](#architecture)
3. [Technologies utilisées](#technologies-utilisées)
4. [Structure du projet](#structure-du-projet)
5. [Prérequis](#prérequis)
6. [Installation](#installation)
7. [Configuration Kafka](#configuration-kafka)
8. [Démarrage des services](#démarrage-des-services)
9. [MS Produit](#ms-produit)
10. [MS Paiement](#ms-paiement)
11. [API Gateway](#api-gateway)
12. [Tests REST — Endpoints](#tests-rest--endpoints)
13. [Tests GraphQL](#tests-graphql)
14. [Topics Kafka](#topics-kafka)
15. [Bases de données](#bases-de-données)
16. [Scénario de démonstration](#scénario-de-démonstration)

---

## Description du projet

Application e-commerce basée sur une architecture microservices développée en Node.js.  
Le système est composé de 4 microservices indépendants, d'une API Gateway, d'un broker Kafka et de bases de données séparées par service.

**Réalisé par :** Binôme — Membre 1 (MS Produit + MS Paiement) · Membre 2 (MS Commande + MS Notification)

---

## Architecture

```
Client (REST / GraphQL)
        │
        ▼
   API Gateway ─── port 3000
   Express + Apollo Server
        │
        ├── gRPC ──► MS Produit      (port 50051) ──► SQLite3
        ├── gRPC ──► MS Paiement     (port 50053) ──► SQLite3
        ├── gRPC ──► MS Commande     (port 50052) ──► RxDB
        └── gRPC ──► MS Notification (port 50054) ──► RxDB

                    Kafka Broker (port 9092 · KRaft)
                    ├── product.events
                    ├── payment.events
                    └── order.events
```

**Flux Kafka :**

```
MS Produit   ──publie──► product.events ──► MS Notification
MS Paiement  ──publie──► payment.events ──► MS Commande + MS Notification
MS Commande  ──publie──► order.events   ──► MS Paiement (pub/sub) + MS Notification
```

---

## Technologies utilisées

| Composant | Technologie |
|---|---|
| Runtime | Node.js v24 |
| Communication sync | gRPC + Protobuf (HTTP/2) |
| Communication async | Apache Kafka 4.2 (KRaft) |
| API REST | Express.js |
| API GraphQL | Apollo Server + graphql |
| Base SQL | SQLite3 (better-sqlite3) |
| Base NoSQL | RxDB |
| Client gRPC | @grpc/grpc-js + @grpc/proto-loader |
| Kafka client | KafkaJS |

---

## Structure du projet

```
marketplace-microservices/
├── protos/
│   ├── product.proto
│   ├── payment.proto
│   ├── order.proto
│   └── notification.proto
├── api-gateway/
│   ├── grpc-clients/
│   │   ├── productClient.js
│   │   ├── paymentClient.js
│   │   ├── orderClient.js
│   │   └── notificationClient.js
│   ├── rest/routes/
│   │   ├── products.js
│   │   ├── payments.js
│   │   ├── orders.js
│   │   └── notifications.js
│   ├── graphql/
│   │   ├── schema.gql
│   │   └── resolvers.js
│   ├── src/index.js
│   └── package.json
├── ms-produit/
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── productService.js
│   │   └── kafkaProducer.js
│   └── package.json
├── ms-paiement/
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── paymentService.js
│   │   ├── kafkaProducer.js
│   │   ├── kafkaConsumer.js
│   │   └── kafkaClient.js
│   └── package.json
├── ms-commande/
│   └── ...
├── ms-notification/
│   └── ...
├── ARCHITECTURE.md
├── KAFKA.md
└── README.md
```

---

## Prérequis

- Node.js v20+ (recommandé) ou v24
- Java 17+ (requis pour Kafka)
- Apache Kafka 4.2 téléchargé depuis https://kafka.apache.org/downloads
- Git

---

## Installation

**1. Cloner le repo :**

```bash
git clone https://github.com/TON-ORG/marketplace-microservices.git
cd marketplace-microservices
```

**2. Installer les dépendances de chaque service :**

```bash
cd ms-produit && npm install && cd ..
cd ms-paiement && npm install && cd ..
cd ms-commande && npm install && cd ..
cd ms-notification && npm install && cd ..
cd api-gateway && npm install && cd ..
```

---

## Configuration Kafka

**1. Initialiser KRaft (première fois uniquement) :**

```powershell
# Windows PowerShell
cd C:\kafka_2.13-4.2.0

$KAFKA_CLUSTER_ID = (.\bin\windows\kafka-storage.bat random-uuid | Select-Object -Last 1)
.\bin\windows\kafka-storage.bat format --standalone -t $KAFKA_CLUSTER_ID -c .\config\server.properties
```

**2. Démarrer Kafka :**

```powershell
.\bin\windows\kafka-server-start.bat .\config\server.properties
```

**3. Créer les topics :**

```powershell
.\bin\windows\kafka-topics.bat --create --topic product.events --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
.\bin\windows\kafka-topics.bat --create --topic payment.events --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
.\bin\windows\kafka-topics.bat --create --topic order.events --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

**4. Vérifier les topics :**

```powershell
.\bin\windows\kafka-topics.bat --list --bootstrap-server localhost:9092
```

Résultat attendu :
```
order.events
payment.events
product.events
```

---

## Démarrage des services

Ouvrir **5 terminaux** et démarrer dans cet ordre exact :

```bash
# Terminal 1 — Kafka (doit être démarré en premier)
cd C:\kafka_2.13-4.2.0
.\bin\windows\kafka-server-start.bat .\config\server.properties

# Terminal 2 — MS Produit
cd marketplace-microservices/ms-produit
node src/server.js

# Terminal 3 — MS Paiement
cd marketplace-microservices/ms-paiement
node src/server.js

# Terminal 4 — MS Commande
cd marketplace-microservices/ms-commande
node src/server.js

# Terminal 5 — MS Notification
cd marketplace-microservices/ms-notification
node src/server.js

# Terminal 6 — API Gateway (en dernier)
cd marketplace-microservices/api-gateway
node src/index.js
```

**Vérification — messages attendus au démarrage :**

```
# MS Produit
Kafka Producer connected for MS Produit
MS Produit gRPC server démarré sur port 50051

# MS Paiement
Kafka Producer connecté pour MS Paiement
MS Paiement gRPC server démarré sur port 50053
Kafka Consumer MS Paiement démarré sur order.events

# API Gateway
API Gateway running on port 3000
GraphQL endpoint: http://localhost:3000/graphql
```

---

## MS Produit

**Port gRPC :** 50051  
**Base de données :** SQLite3 — `products.db`  
**Type Kafka :** Producteur pur

**Méthodes gRPC disponibles :**

| Méthode | Description |
|---|---|
| `GetProduct` | Récupérer un produit par ID |
| `ListProducts` | Lister tous les produits (filtre catégorie optionnel) |
| `CreateProduct` | Créer un nouveau produit |
| `UpdateStock` | Mettre à jour le stock d'un produit |
| `SearchProducts` | Rechercher par nom ou description |
| `GetPromoProducts` | Récupérer les produits en promotion active |

**Événements Kafka publiés sur `product.events` :**

| Événement | Déclencheur |
|---|---|
| `product.created` | Après création d'un produit |
| `stock.updated` | Après mise à jour du stock |
| `stock.low` | Quand le stock passe sous 5 unités |

**Fonctionnalité originalité — Promotions dynamiques :**  
Chaque produit peut avoir un `promo_price` et une `promo_expires_at`. La méthode `GetPromoProducts` retourne uniquement les produits dont la promotion n'a pas expiré.

---

## MS Paiement

**Port gRPC :** 50053  
**Base de données :** SQLite3 — `payments.db`  
**Type Kafka :** Pub/Sub (producteur + consommateur)

**Méthodes gRPC disponibles :**

| Méthode | Description |
|---|---|
| `ProcessPayment` | Initier un paiement (90% completed, 10% failed) |
| `GetPaymentStatus` | Récupérer le statut d'un paiement par order_id |
| `RefundPayment` | Rembourser un paiement (status completed uniquement) |

**Événements Kafka publiés sur `payment.events` :**

| Événement | Déclencheur |
|---|---|
| `payment.completed` | Paiement réussi |
| `payment.failed` | Paiement échoué |
| `payment.refunded` | Remboursement effectué |

**Événements Kafka consommés depuis `order.events` :**

| Événement | Action |
|---|---|
| `order.created` | Déclenche automatiquement un paiement |

**Protections implémentées :**
- Anti double-paiement : un seul paiement par `order_id`
- Remboursement uniquement si status = `completed`
- Validation des paramètres obligatoires en entrée

---

## API Gateway

**Port HTTP :** 3000  
**REST :** Express.js  
**GraphQL :** Apollo Server sur `/graphql`

---

## Tests REST — Endpoints

### Produits

```bash
# Lister tous les produits
GET http://localhost:3000/products

# Filtrer par catégorie
GET http://localhost:3000/products?category=smartphones

# Récupérer un produit
GET http://localhost:3000/products/:id

# Produits en promotion
GET http://localhost:3000/products/promo

# Rechercher
GET http://localhost:3000/products/search/:query

# Créer un produit
POST http://localhost:3000/products
Content-Type: application/json
{
  "name": "iPhone 15 Pro",
  "description": "Smartphone Apple",
  "price": 1299.99,
  "stock": 50,
  "category": "smartphones",
  "promo_price": 999.99,
  "promo_expires_at": "2026-12-31T23:59:59.000Z"
}

# Mettre à jour le stock
PATCH http://localhost:3000/products/:id/stock
Content-Type: application/json
{ "quantity": -8 }
```

### Paiements

```bash
# Initier un paiement
POST http://localhost:3000/payments
Content-Type: application/json
{
  "order_id": "order-001",
  "amount": 500.00,
  "method": "card"
}

# Récupérer statut
GET http://localhost:3000/payments/:orderId

# Rembourser
POST http://localhost:3000/payments/:paymentId/refund
Content-Type: application/json
{}
```

---

## Tests GraphQL

Accéder à Apollo Sandbox : **http://localhost:3000/graphql**

```graphql
# Lister les produits
query {
  products(category: "smartphones") {
    id
    name
    price
    stock
    promo_price
    is_on_promo
  }
}

# Produits en promo
query {
  promoProducts {
    id
    name
    price
    promo_price
    promo_expires_at
  }
}

# Statut paiement
query {
  paymentStatus(orderId: "order-001") {
    id
    order_id
    status
    amount
  }
}

# Créer un produit
mutation {
  createProduct(
    name: "Samsung Galaxy S24"
    price: 999.99
    stock: 30
    category: "smartphones"
  ) {
    id
    name
    stock
  }
}

# Initier un paiement
mutation {
  processPayment(
    order_id: "order-graphql-001"
    amount: 299.99
    method: "card"
  ) {
    id
    order_id
    status
    amount
  }
}

# Rembourser
mutation {
  refundPayment(paymentId: "uuid-du-paiement") {
    id
    order_id
    status
  }
}
```

---

## Topics Kafka

### `product.events`

**Producteur :** MS Produit  
**Consommateurs :** MS Notification

| Type | Format | Déclencheur |
|---|---|---|
| `product.created` | `{ type, product: { id, name, price, stock } }` | POST /products |
| `stock.updated` | `{ type, productId, newStock }` | PATCH /products/:id/stock |
| `stock.low` | `{ type, productId, stock }` | stock < 5 unités |

### `payment.events`

**Producteur :** MS Paiement  
**Consommateurs :** MS Commande, MS Notification

| Type | Format | Déclencheur |
|---|---|---|
| `payment.completed` | `{ type, id, order_id, amount, status, method }` | Paiement réussi |
| `payment.failed` | `{ type, id, order_id, amount, status }` | Paiement échoué |
| `payment.refunded` | `{ type, id, order_id, status }` | Remboursement |

### `order.events`

**Producteur :** MS Commande  
**Consommateurs :** MS Paiement, MS Notification

| Type | Format | Déclencheur |
|---|---|---|
| `order.created` | `{ type, orderId, userId, items, totalAmount }` | Nouvelle commande |
| `order.cancelled` | `{ type, orderId, reason }` | Annulation |

---

## Bases de données

| Microservice | Type | Fichier / Collection | Champs principaux |
|---|---|---|---|
| MS Produit | SQLite3 | `products.db` | id, name, price, stock, category, promo_price, promo_expires_at |
| MS Paiement | SQLite3 | `payments.db` | id, order_id, amount, status, method, created_at, updated_at |
| MS Commande | RxDB | collection `orders` | id, user_id, items, total_amount, status |
| MS Notification | RxDB | collection `notifications` | id, user_id, type, message, read |

---

## Scénario de démonstration

Flux complet bout-en-bout :

```
1. Créer des produits
   POST /products → { name: "iPhone 15", price: 1299, stock: 50 }

2. Créer une commande (MS Commande — M2)
   POST /orders → publie order.created sur order.events

3. MS Paiement reçoit order.created
   → processPayment automatique
   → publie payment.completed sur payment.events

4. MS Commande reçoit payment.completed
   → met à jour le statut de la commande à "confirmed"

5. MS Notification reçoit tous les événements
   → crée les notifications correspondantes

6. Vérifier le statut du paiement
   GET /payments/:orderId → status: "completed"

7. Vérifier les notifications
   GET /notifications/:userId → liste des événements reçus

8. Baisser le stock sous 5
   PATCH /products/:id/stock { quantity: -48 }
   → publie stock.low sur product.events
   → MS Notification crée une alerte admin
```

---

## Surveillance Kafka en temps réel

```powershell
# Surveiller product.events
.\bin\windows\kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic product.events

# Surveiller payment.events
.\bin\windows\kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic payment.events

# Surveiller order.events
.\bin\windows\kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic order.events
```

---

*Projet SOA et Microservices — A.U. 2025/2026 — Dr. Salah Gontara*
