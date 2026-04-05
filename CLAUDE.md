# CLAUDE.md — FidèlePro Backend API

## Project Overview

FidèlePro is a **digital loyalty card platform** built as a Node.js/Express REST API. It serves three user roles:
- **Clients** — customers who collect stamps on loyalty cards via QR code scanning
- **Commerçants** (Merchants) — businesses that create loyalty card programs
- **Admins** — platform administrators who manage users and monitor the system

The business model: merchants pay a 150€ one-time setup fee and 49€/month subscription (via Stripe).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS modules) |
| Framework | Express.js v5 |
| Database | PostgreSQL |
| ORM | Prisma v6 |
| Auth | JWT (jsonwebtoken), bcrypt |
| Payments | Stripe (subscriptions + webhooks) |
| Push Notifications | Firebase Admin SDK (FCM) |
| Email | Resend |
| QR Codes | `qrcode` + `uuid` |
| Deployment | Heroku (via Procfile) |

---

## Repository Structure

```
/
├── server.js                   # Express app entry point — mounts all routes
├── middleware/
│   └── auth.js                 # JWT verification + role-based access control
├── routes/
│   ├── auth.js                 # Registration & login (all roles)
│   ├── commercant.js           # Merchant dashboard, loyalty card creation, client listing
│   ├── client.js               # Client profile, stamps, progression, reviews, FCM token
│   ├── scan.js                 # QR code scanning (merchant adds stamp to client)
│   ├── stripe.js               # Merchant onboarding payment, webhook handler, SEPA setup
│   ├── notifications.js        # Push notification dispatch via FCM
│   └── admin.js                # Admin stats, user management, merchant status control
├── services/
│   ├── email.js                # Resend email service helpers
│   └── notification.js         # Firebase FCM helpers
├── prisma/
│   ├── schema.prisma           # Database schema (source of truth)
│   └── migrations/             # Prisma migration history
├── Procfile                    # Heroku: `web: node server.js`
└── package.json                # Scripts: start, build
```

---

## Database Schema

Managed with Prisma. Models:

| Model | Purpose | Key Fields |
|---|---|---|
| `Admin` | Platform admins | id, nom, email, password |
| `Commercant` | Merchants | id, nom, email, password, telephone, adresse, lienGoogle, stripeCustomerId, stripeSubscriptionId, stripeSetupPaid, statutAbonnement |
| `Client` | Customers | id, nom, email, password, telephone, dateNaissance, qrCode, fcmToken |
| `Carte` | Loyalty card template | id, type, nom, maxTampons, seuilCashback, recompense, commercantId |
| `Tampon` | Individual stamp earned | id, clientId, carteId |
| `Cashback` | Cashback reward record | id, montant, clientId, carteId |
| `Avis` | Customer review | id, note (1-5), commentaire, clientId, commercantId |

**Merchant subscription statuses** (`statutAbonnement`): `inactif`, `actif`, `suspendu`, `résilié`, `impayé`

### Modifying the Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>` (development)
3. Run `npx prisma generate` to update the client
4. Production: migrations run automatically via the `build` script

---

## Authentication & Authorization

**Middleware** (`middleware/auth.js`):
- `verifierToken()` — extracts Bearer token from `Authorization` header, verifies with `JWT_SECRET`, attaches decoded payload to `req.user`
- `verifierRole(role)` — checks `req.user.role` matches the required role

**JWT Payload** contains: `{ id, email, role }` with a 7-day expiry.

**Route Protection Pattern:**
```js
router.get('/route', verifierToken(), verifierRole('commercant'), handler)
```

**Roles:** `'client'`, `'commercant'`, `'admin'`

---

## API Endpoints Summary

### Public (no auth)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/inscription/client` | Register client |
| POST | `/api/auth/connexion/client` | Client login |
| POST | `/api/auth/connexion/commercant` | Merchant login |
| POST | `/api/auth/connexion/admin` | Admin login |
| POST | `/api/stripe/inscription-commercant` | Merchant registration + Stripe checkout |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| GET | `/api/client/avis/:commercantId` | Get merchant reviews (public) |

### Client routes (role: `client`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/client/profil` | Get own profile |
| GET | `/api/client/tampons` | Get stamps collected |
| GET | `/api/client/progression` | Get loyalty progression per card |
| POST | `/api/client/avis` | Submit a review |
| GET | `/api/client/commercant/:id` | Get merchant details |
| POST | `/api/client/fcm-token` | Register FCM push token |

### Merchant routes (role: `commercant`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/commercant/dashboard` | Dashboard stats |
| POST | `/api/commercant/carte` | Create a loyalty card |
| GET | `/api/commercant/clients` | List merchant's clients |
| POST | `/api/scan/` | Scan client QR code (add stamp) |
| POST | `/api/notifications/envoyer` | Send push notification |
| POST | `/api/stripe/setup-sepa` | Setup SEPA payment method |

### Admin routes (role: `admin`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/commercants` | List all merchants |
| GET | `/api/admin/clients` | List all clients |
| GET | `/api/admin/scans` | Scan history |
| PATCH | `/api/admin/commercant/:id/statut` | Update merchant status |
| DELETE | `/api/admin/commercant/:id` | Delete merchant |
| DELETE | `/api/admin/client/:id` | Delete client |

---

## Stripe Integration

**Merchant Onboarding Flow:**
1. `POST /api/stripe/inscription-commercant` — creates Stripe customer, initiates a 150€ one-time checkout session, saves merchant as `inactif`
2. Stripe fires `checkout.session.completed` webhook → merchant activated (`actif`), monthly 49€ subscription created
3. `invoice.payment_failed` webhook → status set to `impayé`
4. `customer.subscription.deleted` webhook → status set to `résilié`

**Important:** The Stripe webhook endpoint requires raw body parsing. In `server.js`, the raw body middleware is registered **before** `express.json()` specifically for `/api/stripe/webhook`.

---

## Services

### Email (`services/email.js`)
Uses the Resend SDK. Import and call helpers to send transactional emails.

### Notifications (`services/notification.js`)
Uses Firebase Admin SDK. Initializes with credentials from the `FIREBASE_KEY` environment variable (JSON string). Provides helpers to send FCM push notifications to client devices (FCM tokens stored in `Client.fcmToken`).

---

## Environment Variables

All required — create a `.env` file locally (never commit it):

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=<long-random-secret>
PORT=3000

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.com

RESEND_API_KEY=re_...
FIREBASE_KEY={"type":"service_account",...}
```

---

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env   # fill in values
npx prisma migrate dev
npx prisma generate
npm start
```

### Running the Server
```bash
npm start              # node server.js
```

There is no `nodemon` dev script configured. Add it manually if needed:
```bash
npx nodemon server.js
```

### Database Migrations
```bash
# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name <descriptive_name>

# Apply migrations in production (runs automatically on Heroku deploy)
npx prisma migrate deploy
```

### Deployment (Heroku)
```bash
git push heroku main   # triggers build script then starts server
```

Build script runs: `npx prisma migrate deploy && npx prisma generate`

---

## Code Conventions

- **Language:** JavaScript (CommonJS, `require`/`module.exports`)
- **Naming:** French for domain terms (`commercant`, `tampon`, `carte`, `avis`); English for technical terms
- **Indentation:** 2 spaces
- **Error responses:** Always `{ message, erreur }` with appropriate HTTP status
- **HTTP status codes:**
  - `200` — success
  - `201` — created
  - `400` — validation/bad request
  - `401` — unauthenticated
  - `403` — forbidden (wrong role or inactive account)
  - `404` — not found
  - `500` — server error
- **Route handlers:** Always wrapped in `try/catch`, errors returned with `res.status(500).json({ message, erreur })`
- **No test framework** is currently configured

### Adding a New Route
1. Create or edit the appropriate file in `routes/`
2. Mount it in `server.js` with `app.use('/api/<name>', require('./routes/<name>'))`
3. Apply `verifierToken()` and `verifierRole()` as needed

---

## Key Constraints & Gotchas

- **Merchant access control:** Routes in `commercant.js` should verify the merchant's `statutAbonnement === 'actif'` before allowing sensitive operations (check individual route implementations).
- **Stripe webhook raw body:** Do not move or reorder the raw body parser in `server.js` — it must come before `express.json()`.
- **Firebase key:** The `FIREBASE_KEY` env var must be the full JSON content of the Firebase service account file (not a file path).
- **QR codes:** Each client gets a unique UUID-based QR code at registration (`Client.qrCode`). Merchants scan this to add stamps.
- **No frontend:** This repository is backend-only. The `.expo` folder is a leftover artifact and not part of this codebase.
- **CommonJS only:** Do not use ES module syntax (`import`/`export`). All files use `require()`.
