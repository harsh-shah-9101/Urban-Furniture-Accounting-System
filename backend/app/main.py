from decimal import Decimal

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import (
    Account,
    AnalyticAccount,
    Budget,
    Contact,
    CustomerInvoice,
    Journal,
    JournalEntry,
    Payment,
    PaymentGatewayOrder,
    Product,
    PurchaseOrder,
    SalesOrder,
    UserRole,
    VendorBill,
)
from app.schemas import (
    AccountCreate,
    AccountOut,
    AccountUpdate,
    AnalyticAccountCreate,
    AnalyticAccountOut,
    AnalyticAccountUpdate,
    AuthOut,
    BalanceSheetOut,
    BudgetCreate,
    BudgetOut,
    BudgetReportOut,
    BudgetUpdate,
    ContactCreate,
    ContactOut,
    ContactUpdate,
    CustomerInvoiceOut,
    CustomerPaymentOut,
    ForgotPasswordIn,
    ForgotPasswordOut,
    JournalCreate,
    JournalEntryOut,
    JournalOut,
    JournalUpdate,
    LoginIn,
    PaymentCreate,
    PaymentGatewayOrderOut,
    PaymentOut,
    PaymentRequest,
    PaymentUpdate,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    ProfitLossOut,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    RazorpayVerifyIn,
    RazorpayVerifyOut,
    ResetPasswordIn,
    SalesOrderCreate,
    SalesOrderOut,
    SignupIn,
    TrialBalanceLineOut,
    VendorBillDatesIn,
    VendorBillOut,
)
from app.services import (
    authenticate_user,
    balance_sheet,
    cancel_customer_invoice,
    cancel_payment,
    cancel_purchase_order,
    cancel_sales_order,
    cancel_vendor_bill,
    confirm_payment,
    create_account,
    create_analytic_account,
    create_budget,
    create_contact,
    create_customer_invoice_payment_order,
    create_customer_invoice_from_so,
    create_journal,
    create_payment,
    create_product,
    create_purchase_order,
    create_sales_order,
    create_user,
    create_vendor_bill_from_po,
    confirm_purchase_order,
    confirm_sales_order,
    delete_model,
    get_or_404,
    make_token,
    pay_customer_invoice,
    pay_vendor_bill,
    post_customer_invoice,
    post_vendor_bill,
    profit_and_loss,
    reset_payment_to_draft,
    request_password_reset,
    reset_password,
    seed,
    trial_balance,
    update_model,
    update_payment,
    update_vendor_bill_dates,
    verify_razorpay_payment,
)

app = FastAPI(title="Urban Furniture Accounting API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.cors_origin_list,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEFAULT_LIST_LIMIT = 200
MAX_LIST_LIMIT = 1000


def apply_pagination(query, limit: int, offset: int):
    return query.offset(offset).limit(limit)


def ensure_schema_upgrades() -> None:
    with engine.begin() as connection:
        connection.execute(text("ALTER TYPE billstatus ADD VALUE IF NOT EXISTS 'partially_paid'"))
        connection.execute(text("ALTER TYPE invoicestatus ADD VALUE IF NOT EXISTS 'partially_paid'"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS contact_type contacttype"))
        connection.execute(text("UPDATE contacts SET contact_type = 'both' WHERE contact_type IS NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ALTER COLUMN contact_type SET DEFAULT 'both'"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ALTER COLUMN contact_type SET NOT NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE"))
        connection.execute(text("UPDATE contacts SET archived = FALSE WHERE archived IS NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ALTER COLUMN archived SET DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE IF EXISTS contacts ALTER COLUMN archived SET NOT NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE IF EXISTS accounts ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE IF EXISTS journals ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE IF EXISTS purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(40) UNIQUE"))
        connection.execute(text("ALTER TABLE IF EXISTS sales_orders ADD COLUMN IF NOT EXISTS so_number VARCHAR(40) UNIQUE"))
        connection.execute(text("ALTER TABLE IF EXISTS purchase_order_lines ADD COLUMN IF NOT EXISTS analytic_account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS purchase_order_lines ADD COLUMN IF NOT EXISTS account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS sales_order_lines ADD COLUMN IF NOT EXISTS analytic_account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS sales_order_lines ADD COLUMN IF NOT EXISTS account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS bill_number VARCHAR(40) UNIQUE"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS bill_reference VARCHAR(120)"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP"))
        connection.execute(text("UPDATE vendor_bills SET invoice_date = bill_date WHERE invoice_date IS NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ALTER COLUMN invoice_date SET DEFAULT CURRENT_TIMESTAMP"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ALTER COLUMN invoice_date SET NOT NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS due_date TIMESTAMP"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS amount_due NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("UPDATE vendor_bills SET amount_due = total_amount - amount_paid WHERE amount_due = 0 AND status != 'paid'"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS paid_by_cash NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS paid_by_bank NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bills ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bill_lines ADD COLUMN IF NOT EXISTS analytic_account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS vendor_bill_lines ADD COLUMN IF NOT EXISTS account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(40) UNIQUE"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMP"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS amount_due NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("UPDATE customer_invoices SET amount_due = total_amount - amount_paid WHERE amount_due = 0 AND status != 'paid'"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS paid_by_cash NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS paid_by_bank NUMERIC(12,2) NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoices ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoice_lines ADD COLUMN IF NOT EXISTS analytic_account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_invoice_lines ADD COLUMN IF NOT EXISTS account_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ALTER COLUMN vendor_bill_id DROP NOT NULL"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS payment_number VARCHAR(40) UNIQUE"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS payment_type paymenttype NOT NULL DEFAULT 'send'"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS partner_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS customer_invoice_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS note TEXT"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS status paymentstatus NOT NULL DEFAULT 'confirmed'"))
        connection.execute(text("ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS customer_payments ADD COLUMN IF NOT EXISTS payment_id INTEGER"))
        connection.execute(text("ALTER TABLE IF EXISTS journal_entries ADD COLUMN IF NOT EXISTS source_type VARCHAR(40)"))
        connection.execute(text("ALTER TABLE IF EXISTS journal_entries ADD COLUMN IF NOT EXISTS source_id INTEGER"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (name)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON contacts (contact_type)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_products_name ON products (name)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_status ON purchase_orders (vendor_id, status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_purchase_orders_id_desc ON purchase_orders (id DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor_status ON vendor_bills (vendor_id, status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_vendor_bills_id_desc ON vendor_bills (id DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_status ON sales_orders (customer_id, status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_orders_id_desc ON sales_orders (id DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer_status ON customer_invoices (customer_id, status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_customer_invoices_id_desc ON customer_invoices (id DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_partner_status ON payments (partner_id, status)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_vendor_bill_id ON payments (vendor_bill_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_payments_customer_invoice_id ON payments (customer_invoice_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_journal_entries_id_desc ON journal_entries (id DESC)"))


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades()
    with SessionLocal() as db:
        seed(db)


def require_role(allowed: set[UserRole], role: str | None) -> UserRole:
    try:
        current_role = UserRole(role or UserRole.customer.value)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="Unknown role") from exc
    if current_role not in allowed:
        raise HTTPException(status_code=403, detail="Role is not allowed for this action")
    return current_role


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "app": "Urban Furniture Accounting System"}


@app.post("/auth/signup", response_model=AuthOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)) -> dict:
    user = create_user(db, payload)
    return {"user": user, "access_token": make_token(user)}


@app.post("/auth/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> dict:
    user = authenticate_user(
        db,
        password=payload.password,
        email=str(payload.email) if payload.email else None,
        login_id=payload.login_id,
    )
    return {"user": user, "access_token": make_token(user)}


@app.post("/auth/forgot-password", response_model=ForgotPasswordOut)
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)) -> dict:
    return request_password_reset(db, payload)


@app.post("/auth/reset-password", response_model=AuthOut)
def post_reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)) -> dict:
    user = reset_password(db, payload)
    return {"user": user, "access_token": make_token(user)}


@app.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    q: str | None = Query(default=None),
    contact_type: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Contact]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Contact)
    if q:
        pattern = f"%{q}%"
        query = query.where(Contact.name.ilike(pattern) | Contact.email.ilike(pattern) | Contact.mobile.ilike(pattern))
    if contact_type:
        query = query.where(Contact.contact_type == contact_type)
    if not include_archived:
        query = query.where(Contact.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(Contact.name), limit, offset)).all())


@app.post("/contacts", response_model=ContactOut)
def post_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Contact:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_contact(db, payload)


@app.get("/contacts/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Contact:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Contact, contact_id, "Contact")


@app.patch("/contacts/{contact_id}", response_model=ContactOut)
def patch_contact(contact_id: int, payload: ContactUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Contact:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, Contact, contact_id, payload, "Contact")


@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, Contact, contact_id, "Contact")


@app.get("/products", response_model=list[ProductOut])
def list_products(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Product]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Product)
    if q:
        pattern = f"%{q}%"
        query = query.where(Product.name.ilike(pattern) | Product.category.ilike(pattern))
    if category:
        query = query.where(Product.category == category)
    if not include_archived:
        query = query.where(Product.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(Product.name), limit, offset)).all())


@app.post("/products", response_model=ProductOut)
def post_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Product:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_product(db, payload)


@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Product:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Product, product_id, "Product")


@app.patch("/products/{product_id}", response_model=ProductOut)
def patch_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Product:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, Product, product_id, payload, "Product")


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, Product, product_id, "Product")


@app.get("/accounts", response_model=list[AccountOut])
def list_accounts(
    q: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Account]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Account)
    if q:
        pattern = f"%{q}%"
        query = query.where(Account.code.ilike(pattern) | Account.name.ilike(pattern))
    if not include_archived:
        query = query.where(Account.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(Account.code), limit, offset)).all())


@app.post("/accounts", response_model=AccountOut)
def post_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Account:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_account(db, payload)


@app.get("/accounts/{account_id}", response_model=AccountOut)
def get_account(account_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Account:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Account, account_id, "Account")


@app.patch("/accounts/{account_id}", response_model=AccountOut)
def patch_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Account:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, Account, account_id, payload, "Account")


@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, Account, account_id, "Account")


@app.get("/journals", response_model=list[JournalOut])
def list_journals(
    q: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Journal]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Journal)
    if q:
        query = query.where(Journal.name.ilike(f"%{q}%"))
    if not include_archived:
        query = query.where(Journal.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(Journal.name), limit, offset)).all())


@app.post("/journals", response_model=JournalOut)
def post_journal(
    payload: JournalCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Journal:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_journal(db, payload)


@app.get("/journals/{journal_id}", response_model=JournalOut)
def get_journal(journal_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Journal:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Journal, journal_id, "Journal")


@app.patch("/journals/{journal_id}", response_model=JournalOut)
def patch_journal(journal_id: int, payload: JournalUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Journal:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, Journal, journal_id, payload, "Journal")


@app.delete("/journals/{journal_id}")
def delete_journal(journal_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, Journal, journal_id, "Journal")


@app.get("/analytic-accounts", response_model=list[AnalyticAccountOut])
def list_analytic_accounts(
    q: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[AnalyticAccount]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(AnalyticAccount)
    if q:
        pattern = f"%{q}%"
        query = query.where(AnalyticAccount.name.ilike(pattern) | AnalyticAccount.code.ilike(pattern))
    if not include_archived:
        query = query.where(AnalyticAccount.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(AnalyticAccount.name), limit, offset)).all())


@app.post("/analytic-accounts", response_model=AnalyticAccountOut)
def post_analytic_account(payload: AnalyticAccountCreate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> AnalyticAccount:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_analytic_account(db, payload)


@app.get("/analytic-accounts/{analytic_account_id}", response_model=AnalyticAccountOut)
def get_analytic_account(analytic_account_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> AnalyticAccount:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, AnalyticAccount, analytic_account_id, "Analytic account")


@app.patch("/analytic-accounts/{analytic_account_id}", response_model=AnalyticAccountOut)
def patch_analytic_account(analytic_account_id: int, payload: AnalyticAccountUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> AnalyticAccount:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, AnalyticAccount, analytic_account_id, payload, "Analytic account")


@app.delete("/analytic-accounts/{analytic_account_id}")
def delete_analytic_account(analytic_account_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, AnalyticAccount, analytic_account_id, "Analytic account")


@app.get("/budgets", response_model=list[BudgetOut])
def list_budgets(
    q: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Budget]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Budget)
    if q:
        query = query.where(Budget.name.ilike(f"%{q}%"))
    if not include_archived:
        query = query.where(Budget.archived.is_(False))
    return list(db.scalars(apply_pagination(query.order_by(Budget.name), limit, offset)).all())


@app.post("/budgets", response_model=BudgetOut)
def post_budget(payload: BudgetCreate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Budget:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_budget(db, payload)


@app.get("/budgets/{budget_id}", response_model=BudgetOut)
def get_budget(budget_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Budget:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Budget, budget_id, "Budget")


@app.patch("/budgets/{budget_id}", response_model=BudgetOut)
def patch_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> Budget:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_model(db, Budget, budget_id, payload, "Budget")


@app.delete("/budgets/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return delete_model(db, Budget, budget_id, "Budget")


@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return {
        "contacts": db.scalar(select(func.count()).select_from(Contact)),
        "products": db.scalar(select(func.count()).select_from(Product)),
        "accounts": db.scalar(select(func.count()).select_from(Account)),
        "journals": db.scalar(select(func.count()).select_from(Journal)),
        "purchase_orders": db.scalar(select(func.count()).select_from(PurchaseOrder)),
        "vendor_bills": db.scalar(select(func.count()).select_from(VendorBill)),
        "sales_orders": db.scalar(select(func.count()).select_from(SalesOrder)),
        "customer_invoices": db.scalar(select(func.count()).select_from(CustomerInvoice)),
        "journal_entries": db.scalar(select(func.count()).select_from(JournalEntry)),
        "available_modules": ["master_data", "purchase", "vendor_bill", "sales", "customer_invoice", "payments", "reports"],
    }


@app.get("/purchase-orders", response_model=list[PurchaseOrderOut])
def list_purchase_orders(
    status: str | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[PurchaseOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(PurchaseOrder).options(selectinload(PurchaseOrder.lines))
    if status:
        query = query.where(PurchaseOrder.status == status)
    if vendor_id:
        query = query.where(PurchaseOrder.vendor_id == vendor_id)
    return list(db.scalars(apply_pagination(query.order_by(PurchaseOrder.id.desc()), limit, offset)).all())


@app.post("/purchase-orders", response_model=PurchaseOrderOut)
def post_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PurchaseOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_purchase_order(db, payload)


@app.get("/purchase-orders/{order_id}", response_model=PurchaseOrderOut)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PurchaseOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return order


@app.post("/purchase-orders/{order_id}/confirm", response_model=PurchaseOrderOut)
def post_purchase_order_confirm(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PurchaseOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return confirm_purchase_order(db, order_id)


@app.post("/purchase-orders/{order_id}/cancel", response_model=PurchaseOrderOut)
def post_purchase_order_cancel(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PurchaseOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return cancel_purchase_order(db, order_id)


@app.post("/purchase-orders/{order_id}/create-bill", response_model=VendorBillOut)
def post_purchase_order_bill(
    order_id: int,
    payload: VendorBillDatesIn | None = Body(default=None),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_vendor_bill_from_po(db, order_id, payload)


@app.get("/vendor-bills", response_model=list[VendorBillOut])
def list_vendor_bills(
    status: str | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[VendorBill]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(VendorBill).options(selectinload(VendorBill.lines), selectinload(VendorBill.payments))
    if status:
        query = query.where(VendorBill.status == status)
    if vendor_id:
        query = query.where(VendorBill.vendor_id == vendor_id)
    return list(db.scalars(apply_pagination(query.order_by(VendorBill.id.desc()), limit, offset)).all())


@app.get("/vendor-bills/{bill_id}", response_model=VendorBillOut)
def get_vendor_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    return bill


@app.patch("/vendor-bills/{bill_id}/dates", response_model=VendorBillOut)
def patch_vendor_bill_dates(
    bill_id: int,
    payload: VendorBillDatesIn,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_vendor_bill_dates(db, bill_id, payload)


@app.post("/vendor-bills/{bill_id}/post", response_model=VendorBillOut)
def post_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return post_vendor_bill(db, bill_id)


@app.post("/vendor-bills/{bill_id}/pay", response_model=PaymentOut)
def post_bill_payment(
    bill_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PaymentOut:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return pay_vendor_bill(db, bill_id, payload)


@app.post("/vendor-bills/{bill_id}/cancel", response_model=VendorBillOut)
def post_vendor_bill_cancel(
    bill_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return cancel_vendor_bill(db, bill_id)


@app.get("/vendor-bills/{bill_id}/payments", response_model=list[PaymentOut])
def get_vendor_bill_payments(
    bill_id: int,
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Payment]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    get_or_404(db, VendorBill, bill_id, "Vendor bill")
    query = select(Payment).where(Payment.vendor_bill_id == bill_id).order_by(Payment.id.desc())
    return list(db.scalars(apply_pagination(query, limit, offset)).all())


@app.get("/journal-entries", response_model=list[JournalEntryOut])
def list_journal_entries(
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[JournalEntry]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(JournalEntry).options(selectinload(JournalEntry.lines)).order_by(JournalEntry.id.desc())
    return list(db.scalars(apply_pagination(query, limit, offset)).all())


@app.get("/sales-orders", response_model=list[SalesOrderOut])
def list_sales_orders(
    status: str | None = Query(default=None),
    customer_id: int | None = Query(default=None),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[SalesOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(SalesOrder).options(selectinload(SalesOrder.lines))
    if status:
        query = query.where(SalesOrder.status == status)
    if customer_id:
        query = query.where(SalesOrder.customer_id == customer_id)
    return list(db.scalars(apply_pagination(query.order_by(SalesOrder.id.desc()), limit, offset)).all())


@app.post("/sales-orders", response_model=SalesOrderOut)
def post_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> SalesOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_sales_order(db, payload)


@app.get("/sales-orders/{order_id}", response_model=SalesOrderOut)
def get_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> SalesOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order


@app.post("/sales-orders/{order_id}/confirm", response_model=SalesOrderOut)
def post_sales_order_confirm(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> SalesOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return confirm_sales_order(db, order_id)


@app.post("/sales-orders/{order_id}/cancel", response_model=SalesOrderOut)
def post_sales_order_cancel(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> SalesOrder:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return cancel_sales_order(db, order_id)


@app.post("/sales-orders/{order_id}/create-invoice", response_model=CustomerInvoiceOut)
def post_sales_order_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> CustomerInvoice:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_customer_invoice_from_so(db, order_id)


@app.get("/customer-invoices", response_model=list[CustomerInvoiceOut])
def list_customer_invoices(
    status: str | None = Query(default=None),
    customer_id: int | None = Query(default=None),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[CustomerInvoice]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(CustomerInvoice).options(selectinload(CustomerInvoice.lines), selectinload(CustomerInvoice.payments))
    if status:
        query = query.where(CustomerInvoice.status == status)
    if customer_id:
        query = query.where(CustomerInvoice.customer_id == customer_id)
    return list(db.scalars(apply_pagination(query.order_by(CustomerInvoice.id.desc()), limit, offset)).all())


@app.get("/customer-invoices/{invoice_id}", response_model=CustomerInvoiceOut)
def get_customer_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> CustomerInvoice:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    return invoice


@app.post("/customer-invoices/{invoice_id}/post", response_model=CustomerInvoiceOut)
def post_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> CustomerInvoice:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return post_customer_invoice(db, invoice_id)


@app.post("/customer-invoices/{invoice_id}/pay", response_model=CustomerPaymentOut)
def post_invoice_payment(
    invoice_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> CustomerPaymentOut:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return pay_customer_invoice(db, invoice_id, payload)


@app.post("/customer-invoices/{invoice_id}/cancel", response_model=CustomerInvoiceOut)
def post_customer_invoice_cancel(
    invoice_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> CustomerInvoice:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return cancel_customer_invoice(db, invoice_id)


@app.get("/customer-invoices/{invoice_id}/payments", response_model=list[PaymentOut])
def get_customer_invoice_payments(
    invoice_id: int,
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Payment]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    get_or_404(db, CustomerInvoice, invoice_id, "Customer invoice")
    query = select(Payment).where(Payment.customer_invoice_id == invoice_id).order_by(Payment.id.desc())
    return list(db.scalars(apply_pagination(query, limit, offset)).all())


@app.get("/payments", response_model=list[PaymentOut])
def list_payments(
    payment_type: str | None = None,
    partner_id: int | None = None,
    status: str | None = None,
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[Payment]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(Payment)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    if partner_id:
        query = query.where(Payment.partner_id == partner_id)
    if status:
        query = query.where(Payment.status == status)
    return list(db.scalars(apply_pagination(query.order_by(Payment.id.desc()), limit, offset)).all())


@app.post("/payments", response_model=PaymentOut)
def post_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_payment(db, payload)


@app.post("/payments/razorpay/verify", response_model=RazorpayVerifyOut)
def post_razorpay_verify(
    payload: RazorpayVerifyIn,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> dict:
    require_role({UserRole.admin, UserRole.accountant, UserRole.customer}, x_user_role)
    invoice, payment, gateway_order = verify_razorpay_payment(db, payload)
    gateway_order.key_id = settings.razorpay_key_id or "demo_key_id"
    return {
        "verified": True,
        "invoice": invoice,
        "payment": payment,
        "gateway_order": gateway_order,
    }


@app.get("/payments/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return get_or_404(db, Payment, payment_id, "Payment")


@app.patch("/payments/{payment_id}", response_model=PaymentOut)
def patch_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return update_payment(db, payment_id, payload)


@app.post("/payments/{payment_id}/confirm", response_model=PaymentOut)
def post_payment_confirm(
    payment_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return confirm_payment(db, payment_id)


@app.post("/payments/{payment_id}/cancel", response_model=PaymentOut)
def post_payment_cancel(
    payment_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return cancel_payment(db, payment_id)


@app.post("/payments/{payment_id}/reset-to-draft", response_model=PaymentOut)
def post_payment_reset_to_draft(
    payment_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Payment:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return reset_payment_to_draft(db, payment_id)


@app.post("/customer-invoices/{invoice_id}/razorpay-order", response_model=PaymentGatewayOrderOut)
def post_customer_invoice_razorpay_order(
    invoice_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> PaymentGatewayOrder:
    require_role({UserRole.admin, UserRole.accountant, UserRole.customer}, x_user_role)
    gateway_order = create_customer_invoice_payment_order(db, invoice_id)
    gateway_order.key_id = settings.razorpay_key_id or "demo_key_id"
    return gateway_order


@app.get("/payment-gateway/orders", response_model=list[PaymentGatewayOrderOut])
def list_payment_gateway_orders(
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[PaymentGatewayOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    query = select(PaymentGatewayOrder).order_by(PaymentGatewayOrder.id.desc())
    orders = list(db.scalars(apply_pagination(query, limit, offset)).all())
    for order in orders:
        order.key_id = settings.razorpay_key_id or "demo_key_id"
    return orders


@app.get("/reports/trial-balance", response_model=list[TrialBalanceLineOut])
def get_trial_balance(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[dict]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return trial_balance(db)


@app.get("/reports/profit-loss", response_model=ProfitLossOut)
def get_profit_loss(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return profit_and_loss(db)


@app.get("/reports/balance-sheet", response_model=BalanceSheetOut)
def get_balance_sheet(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return balance_sheet(db)


@app.get("/reports/budget", response_model=BudgetReportOut)
def get_budget_report(
    target_income: Decimal = Query(default=Decimal("100000"), ge=0),
    budgeted_expense: Decimal = Query(default=Decimal("60000"), ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    pl = profit_and_loss(db)
    return {
        "target_income": target_income,
        "actual_income": pl["income"],
        "income_variance": pl["income"] - target_income,
        "budgeted_expense": budgeted_expense,
        "actual_expense": pl["expense"],
        "expense_variance": budgeted_expense - pl["expense"],
        "net_profit": pl["net_profit"],
    }


@app.get("/customer-portal/invoices", response_model=list[CustomerInvoiceOut])
def customer_portal_invoices(
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    x_customer_email: str | None = Header(default=None),
) -> list[CustomerInvoice]:
    require_role({UserRole.customer}, x_user_role)
    if not x_customer_email:
        raise HTTPException(status_code=400, detail="X-Customer-Email header is required")
    customer = db.scalar(select(Contact).where(Contact.email == x_customer_email))
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer contact not found")
    return list(
        db.scalars(
            apply_pagination(
                select(CustomerInvoice).options(selectinload(CustomerInvoice.lines), selectinload(CustomerInvoice.payments))
            .where(CustomerInvoice.customer_id == customer.id)
            .order_by(CustomerInvoice.id.desc()),
                limit,
                offset,
            )
        ).all()
    )


@app.post("/customer-portal/invoices/{invoice_id}/pay", response_model=CustomerPaymentOut)
def customer_portal_pay_invoice(
    invoice_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    x_customer_email: str | None = Header(default=None),
) -> CustomerPaymentOut:
    require_role({UserRole.customer}, x_user_role)
    if not x_customer_email:
        raise HTTPException(status_code=400, detail="X-Customer-Email header is required")
    customer = db.scalar(select(Contact).where(Contact.email == x_customer_email))
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer contact not found")
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="You can only pay your own invoice")
    return pay_customer_invoice(db, invoice_id, payload)


@app.get("/customer-portal/invoices/{invoice_id}", response_model=CustomerInvoiceOut)
def customer_portal_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    x_customer_email: str | None = Header(default=None),
) -> CustomerInvoice:
    require_role({UserRole.customer}, x_user_role)
    if not x_customer_email:
        raise HTTPException(status_code=400, detail="X-Customer-Email header is required")
    customer = db.scalar(select(Contact).where(Contact.email == x_customer_email))
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer contact not found")
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None or invoice.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    return invoice
