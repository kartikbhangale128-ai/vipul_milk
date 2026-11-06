# VIPUL MILK – DAIRY MANAGEMENT & BILLING SYSTEM

A complete, production-ready, full-stack web application custom-designed for **Vipul Milk**, engineered for single-operator daily dairy management, multi-customer spreadsheet data entry, historical price/rate versioning, and monthly billing with automated OpenHTMLtoPDF invoice rendering and ZIP packaging.

---

## Architecture & Technology Stack

### Backend
- **Java 21 LTS**
- **Spring Boot 3.4.3**
- **Spring Security** (BCrypt password hashing, HTTP-only secure cookie session, REST protection)
- **Spring Data JPA & Hibernate 6**
- **PostgreSQL 17** (Real production database with Flyway DB migrations)
- **OpenHTMLtoPDF (PDFBox)** (Pixel-perfect A4 printable PDF invoice rendering)
- **Jackson Datatype JSR310 & JsonB snapshotting**

### Frontend
- **React 19 with TypeScript**
- **Vite 8**
- **Tailwind CSS v4** (Minimalist, warm stone/neutral background, restrained Vipul Milk red accents)
- **React Router DOM 7**
- **Axios** with authenticated cookie interceptors
- **Lucide React Icons**
- **PWA Ready** (Responsive mobile/desktop layouts, web app manifest)

---

## Key Modules & Core Business Rules

1. **Owner Authentication (`/login`)**:
   - Single-operator mode.
   - Initial credentials:
     - **Username**: `vipul`
     - **Default Password**: `vipul@dairy2026`
   - Owner can securely change their password anytime in Settings.

2. **Dashboard Overview (`/dashboard`)**:
   - Total active customers count.
   - Today's morning, evening, and total milk intake in litres.
   - Authoritative active standard milk rate.
   - Current month projected milk sales, product sales, and estimated aggregate billing.
   - Live dairy activity feed.

3. **Customer Management (`/customers`)**:
   - Auto-generated sequential customer codes (`CUST-001`, `CUST-002`, ...).
   - Real-time search by name, phone, or customer code.
   - Pagination and filter by active/inactive status.
   - Full soft-deactivation: historical entries, billing records, and PDFs remain permanently preserved.
   - Customer detail drawer displaying full milk intake logs and product purchases.

4. **Daily Milk Entry Grid (`/milk-entry`)**:
   - Spreadsheet-like data entry supporting 300–400 customers.
   - Flexible date ranges (e.g., 01–10, 11–20, 21–31, or arbitrary date spans).
   - Morning (AM) and Evening (PM) decimal quantity recording (e.g. 0.5, 1.25, 2.0 litres).
   - "Copy Previous Day" automation for batch operations.
   - Unsaved changes indicator and bulk transactional persistence.
   - Authoritative per-day rate resolution on the backend based on historical effective dates.

5. **Product Management & Purchases (`/product-sales`)**:
   - Track purchases for Paneer, Ghee, Basundi, Khava (Mawa), Curd, Butter, etc.
   - Price freeze guarantee: changing product prices in future never mutates older purchases.
   - Authoritative backend pricing resolution on purchase date.

6. **Milk Rate & Product Price Settings (`/rates`)**:
   - Common milk rate per litre for all customers with immutable effective dates.
   - Historical records are never overwritten: inserting a rate creates a new version (`effective_from <= entry_date`).
   - Warning and prevention of duplicate effective dates.

7. **Monthly Bills & PDF Invoicing (`/bills`)**:
   - Draft preview calculation supporting multi-rate periods within a single month.
   - Finalization locks the bill permanently into JSONB snapshots.
   - Single-customer A4 PDF invoice download.
   - Batch ZIP download (`<Month>_<Year>_All_Bills.zip`) containing all monthly PDFs.

---

## Local Development & Testing

### 1. Database Setup
- PostgreSQL is running locally on port `5432`.
- Database name: `vipul_milk_db`
- Connection details configured in `backend/src/main/resources/application.properties`.

### 2. Run Backend Tests
```bash
cd backend
mvn test
```
All integration and business rule tests execute against PostgreSQL and pass:
- Customer lifecycle and deactivation history preservation
- Historical milk rate versioning and effective date resolution
- Bulk milk entry calculation and persistence
- Product purchase price freezing
- Monthly bill preview, finalization, PDF rendering, and ZIP generation

### 3. Start Backend
```bash
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`.

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (or `http://localhost:5174`).

