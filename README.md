# Urban Furniture Accounting System

Full-stack hackathon app for the Urban Furniture accounting workflow.

## Stack

- Frontend: React + Vite
- Backend: Python FastAPI + SQLAlchemy
- Database: PostgreSQL
- Database UI: pgAdmin
- Local orchestration: Docker Compose

## Completed Backend Stage

The backend now covers the main accounting workflow:

- Login
- Signup
- Login by email or login ID
- Admin/accountant/customer role checks
- Dashboard summary
- Contact, product, account, and journal master data
- Purchase order -> vendor bill -> vendor bill payment
- Sales order -> customer invoice -> customer invoice payment
- Razorpay payment order creation and signature verification
- Automatic debit/credit journal entries
- Trial balance, profit/loss, balance sheet, and budget report
- Customer portal invoice view

## Demo Users

- Admin: `admin01` or `admin@urbanbooksapp.com` / `Admin@123`
- Accountant: `acct01` or `accountant@urbanbooksapp.com` / `Account@123`
- Customer: `nimesh01` or `nimesh@example.com` / `Nimesh@123`

## Run Backend Locally

Create `backend/.env` from `backend/.env.example`, then update it for your pgAdmin/PostgreSQL port and password.

```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 5000
```

API docs:

- http://localhost:5000/docs

## Run With Docker

Start Docker Desktop first, then run:

```bash
docker compose up --build
```

Services:

- Backend API docs: http://localhost:5000/docs
- pgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432

pgAdmin login:

- Email: admin@urbanbooks.local
- Password: admin

PostgreSQL connection inside pgAdmin:

- Host: postgres
- Port: 5432
- Database: urban_furniture_accounting
- User: urbanbooks
- Password: urbanbooks

## Build Order

1. Auth + roles
2. Master data: contacts, products, accounts, journals
3. Purchase order -> vendor bill -> bill payment
4. Sales order -> customer invoice -> invoice payment
5. Journal entries with debit/credit validation
6. Balance sheet, profit and loss, and budget report

## Main API Groups

- Auth: `/auth/signup`, `/auth/login`
- Master data: `/contacts`, `/products`, `/accounts`, `/journals`
- Purchase: `/purchase-orders`, `/purchase-orders/{id}/confirm`, `/purchase-orders/{id}/create-bill`
- Vendor bills: `/vendor-bills`, `/vendor-bills/{id}/dates`, `/vendor-bills/{id}/post`, `/vendor-bills/{id}/pay`
- Sales: `/sales-orders`, `/sales-orders/{id}/confirm`, `/sales-orders/{id}/create-invoice`
- Customer invoices: `/customer-invoices`, `/customer-invoices/{id}/post`, `/customer-invoices/{id}/pay`
- Customer portal: `/customer-portal/invoices`
- Reports: `/reports/trial-balance`, `/reports/profit-loss`, `/reports/balance-sheet`, `/reports/budget`
- Payment gateway: `/customer-invoices/{id}/razorpay-order`, `/payments/razorpay/verify`, `/payment-gateway/orders`

## Razorpay Payment Flow

## Vendor Bill Dates

When converting a purchase order to a vendor bill, the date fields are optional. If the frontend sends no body, `invoice_date` is set automatically and `due_date` stays blank.

```json
{
  "invoice_date": "2026-09-05T00:00:00",
  "due_date": "2026-09-15T00:00:00"
}
```

Draft vendor bill dates can also be edited with `PATCH /vendor-bills/{bill_id}/dates` using the same body. The API rejects a due date earlier than the invoice date.

## Razorpay Payment Flow

Add Razorpay test keys in `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
PAYMENT_CURRENCY=INR
```

Flow:

1. Admin/accountant posts a customer invoice.
2. Frontend calls `POST /customer-invoices/{invoice_id}/razorpay-order`.
3. Backend creates a Razorpay order and returns `provider_order_id`, `amount`, `currency`, and `key_id`.
4. Frontend opens Razorpay Checkout using that order id.
5. After payment, frontend sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `POST /payments/razorpay/verify`.
6. Backend verifies the HMAC SHA256 signature, marks invoice as paid, creates customer payment, and posts journal entries.

If Razorpay keys are empty, the backend runs in demo mode for hackathon testing. Use `razorpay_signature` as `demo`.
