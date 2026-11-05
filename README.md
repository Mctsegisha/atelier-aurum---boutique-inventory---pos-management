# Hirbit Store — Retail Inventory & Point-of-Sale (POS) Management System

A full-stack web application architected for boutique retail, inventory control, and multi-terminal point-of-sale operations.
Located at **Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa, Ethiopia**, utilizing **Ethiopian Birr (ETB)** as primary currency.

Featuring strict multi-role Role-Based Access Control (RBAC), atomic POS transactions with idempotency guarantees, variant-level inventory control, supply chain tracking, financial profit & loss analytics, and immutable audit trails.

---

## 1. System Architecture & Tech Stack

### Frontend (`./frontend`)
- **Framework**: React 19 with TypeScript, Vite build tool.
- **Styling**: Tailwind CSS v4, luxury retail palette (Deep Charcoal `#1A1A1A`, Travertine `#E8DFD3`, Muted Gold `#B89B65`, Warm Canvas `#F9F8F6`).
- **Typography**: Cormorant Garamond display serif paired with Plus Jakarta Sans body.
- **Visuals & Charts**: Recharts for revenue momentum and category performance, Lucide React icons.
- **Currency & Formatting**: Standardized Ethiopian Birr (`ETB`) formatting across all price tags, cards, modals, and thermal receipt slips.

### Backend & Database (`./backend`)
- **Runtime**: Node.js & TypeScript Express server with RESTful API architecture.
- **Relational Storage**: Neon PostgreSQL (Serverless connection pooler with `sslmode=require`), zero SQLite dependency.
- **Security & RBAC**: JWT Bearer authentication, bcryptjs password hashing, server-side permission verification middleware.
- **Dual Transport**: High-throughput persistent pooling with HTTPS Serverless fallback.

---

## 2. Project Structure & Production Deployment

The project is cleanly decoupled into two standalone top-level workspaces: `frontend` and `backend`.

```text
hirbit-store/
├── backend/                     # Node.js / Express Architecture
│   ├── src/                     # Core backend source
│   │   ├── app.ts               # Express application pipeline & security headers
│   │   ├── server.ts            # Server entrypoint & graceful shutdown lifecycle
│   │   ├── config/              # Validated environment & database settings
│   │   ├── database/            # Neon PostgreSQL connection, schema, and seed
│   │   ├── middleware/          # Timing-safe auth, authorize, validate, rateLimiter
│   │   ├── modules/             # Modular Controller-Service-Repository domain features
│   │   │   ├── auth/            # Authentication & session management
│   │   │   ├── pos/             # Atomic POS checkout & integer cents calculation
│   │   │   ├── products/        # Product catalog & approval workflow
│   │   │   ├── inventory/       # Stock tracking & audit movements
│   │   │   ├── sales/           # Sales & refund processing
│   │   │   ├── customers/       # Customer directory & purchasing records
│   │   │   ├── suppliers/       # Vendors & purchase orders
│   │   │   ├── expenses/        # Operating expenses & category tracking
│   │   │   ├── reports/         # Parameterized dashboard queries & analytics
│   │   │   ├── users/           # Employee management & RBAC administration
│   │   │   ├── settings/        # Store configurations (ETB, address, receipt)
│   │   │   ├── shifts/          # Register float reconciliation & shift auditing
│   │   │   └── audit/           # Forensic action logging & notifications
│   │   └── utils/               # Secure ID generation, currency math, logger
│   ├── tests/                   # RBAC, POS financial, and Auth security tests
│   ├── package.json             # Backend dependencies & scripts
│   └── tsconfig.json            # Node Next TypeScript configuration
├── frontend/                    # Vite + React 19 Client
│   ├── src/                     # React components, views, styles, context
│   ├── index.html               # Single Page Application HTML shell
│   ├── vite.config.ts           # Vite config with API proxy
│   ├── package.json             # Frontend dependencies & scripts
│   └── tsconfig.json            # Frontend TypeScript configuration
├── package.json                 # Monorepo workspaces manifest & scripts
├── render.yaml                  # Production blueprint for Render hosting
├── .env.example                 # Root environment template
└── README.md
```

### Production Build & Launch

#### Building the Application
```bash
# Build both frontend and backend
npm run build

# Or individually:
cd frontend && npm run build
cd backend && npm run build
```

#### Starting the Production Backend Server
```bash
cd backend
npm start
```

---

## 3. RBAC Role & Permission Matrix

| Module / Operation | System Administrator | Store Manager | Sales Associate | Server-Enforced Policy |
| :--- | :---: | :---: | :---: | :--- |
| **Financial P&L (COGS, Net Profit)** | Full Access | Restricted | Forbidden (403) | Sales & Store Manager cannot query wholesale purchase prices or profit margins. |
| **Store Dashboard & Volume** | Full Access | Full Access | Shift Only | Sales sees personal shift and register volume only. |
| **Point of Sale (POS)** | Full Access | Full Access | Full Access | All roles can scan barcodes, select variants, and settle payments. |
| **Product Management** | Full CRUD | Add / Edit | Read-Only (POS) | Sales cannot alter prices, SKU metadata, or archive products. |
| **Stock Adjustments** | Unrestricted | Permitted | Forbidden (403) | Mandatory reason and operator ID logged in `inventory_movements`. |
| **Stock Receiving / Intake** | Full Access | Full Access | Forbidden (403) | Replenishes variant on-hand stock and updates PO lines. |
| **Sales History** | All Staff | All Staff | Own Sales Only | Sales queries automatically filter `WHERE s.cashier_id = req.user.id`. |
| **Returns & Refunds** | Process & Auth | Process & Auth | Request Only | Requires Store Manager or Admin override and records restocking decision. |
| **Customer Management** | Full Access | Full Access | Full Access | Sales can attach existing customers or register new customers during POS checkout. |
| **Suppliers & Purchase Orders** | Full Access | Full Access | Forbidden (403) | Sales staff have no visibility into suppliers or purchase costs. |
| **Operating Expenses** | Full CRUD | Record / View | Forbidden (403) | Store packaging, utilities, and maintenance disbursements. |
| **User & Role Administration** | Full CRUD | Forbidden (403)| Forbidden (403) | Only Admin can create staff, toggle active status, or assign roles. |
| **Security Audit Logs** | Full Access | Forbidden (403)| Forbidden (403) | Forensic log of all logins, stock edits, overrides, and settings changes. |
| **Store Settings** | Full Access | Read-Only | Read-Only | Tax %, ETB currency, receipt headers, and negative stock policy. |

---

## 4. Default Store Accounts

- **System Administrator**: `admin@aurum.boutique` / `admin123456`
  - Name: Vivienne Laurent
  - Full authority: Executive P&L financial reports, user account creation, system configuration, audit logs.
- **Store Manager**: `storeperson@aurum.boutique` / `manager123456`
  - Name: Julian Vance
  - Operations authority: Stock receiving, manual inventory adjustments, returns authorization, PO issuance.
- **Sales Associate**: `sales@aurum.boutique` / `cashier123456`
  - Name: Camille Moreau
  - Sales authority: Point of Sale, instant barcode search, printable receipts in ETB, cash register reconciliation.
