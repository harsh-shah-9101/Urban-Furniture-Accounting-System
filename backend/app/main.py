from decimal import Decimal

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import Account, Contact, CustomerInvoice, Journal, JournalEntry, PaymentGatewayOrder, Product, PurchaseOrder, SalesOrder, UserRole, VendorBill
from app.schemas import (
    AccountCreate,
    AccountOut,
    AuthOut,
    BalanceSheetOut,
    BudgetReportOut,
    ContactCreate,
    ContactOut,
    CustomerInvoiceOut,
    CustomerPaymentOut,
    JournalCreate,
    JournalEntryOut,
    JournalOut,
    LoginIn,
    PaymentCreate,
    PaymentGatewayOrderOut,
    PaymentOut,
    ProductCreate,
    ProductOut,
    ProfitLossOut,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    RazorpayVerifyIn,
    RazorpayVerifyOut,
    SalesOrderCreate,
    SalesOrderOut,
    SignupIn,
    TrialBalanceLineOut,
    VendorBillOut,
)
from app.services import (
    authenticate_user,
    balance_sheet,
    create_account,
    create_contact,
    create_customer_invoice_payment_order,
    create_customer_invoice_from_so,
    create_journal,
    create_product,
    create_purchase_order,
    create_sales_order,
    create_user,
    create_vendor_bill_from_po,
    confirm_purchase_order,
    confirm_sales_order,
    make_token,
    pay_customer_invoice,
    pay_vendor_bill,
    post_customer_invoice,
    post_vendor_bill,
    profit_and_loss,
    seed,
    trial_balance,
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


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
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


@app.get("/contacts", response_model=list[ContactOut])
def list_contacts(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> list[Contact]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(Contact).order_by(Contact.name)).all())


@app.post("/contacts", response_model=ContactOut)
def post_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Contact:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_contact(db, payload)


@app.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> list[Product]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(Product).order_by(Product.name)).all())


@app.post("/products", response_model=ProductOut)
def post_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Product:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_product(db, payload)


@app.get("/accounts", response_model=list[AccountOut])
def list_accounts(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> list[Account]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(Account).order_by(Account.code)).all())


@app.post("/accounts", response_model=AccountOut)
def post_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Account:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_account(db, payload)


@app.get("/journals", response_model=list[JournalOut])
def list_journals(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> list[Journal]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(Journal).order_by(Journal.name)).all())


@app.post("/journals", response_model=JournalOut)
def post_journal(
    payload: JournalCreate,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> Journal:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_journal(db, payload)


@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)) -> dict:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return {
        "contacts": len(db.scalars(select(Contact)).all()),
        "products": len(db.scalars(select(Product)).all()),
        "accounts": len(db.scalars(select(Account)).all()),
        "journals": len(db.scalars(select(Journal)).all()),
        "purchase_orders": len(db.scalars(select(PurchaseOrder)).all()),
        "vendor_bills": len(db.scalars(select(VendorBill)).all()),
        "sales_orders": len(db.scalars(select(SalesOrder)).all()),
        "customer_invoices": len(db.scalars(select(CustomerInvoice)).all()),
        "journal_entries": len(db.scalars(select(JournalEntry)).all()),
        "available_modules": ["master_data", "purchase", "vendor_bill", "sales", "customer_invoice", "payments", "reports"],
    }


@app.get("/purchase-orders", response_model=list[PurchaseOrderOut])
def list_purchase_orders(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[PurchaseOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(PurchaseOrder).order_by(PurchaseOrder.id.desc())).all())


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


@app.post("/purchase-orders/{order_id}/create-bill", response_model=VendorBillOut)
def post_purchase_order_bill(
    order_id: int,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> VendorBill:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return create_vendor_bill_from_po(db, order_id)


@app.get("/vendor-bills", response_model=list[VendorBillOut])
def list_vendor_bills(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[VendorBill]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(VendorBill).order_by(VendorBill.id.desc())).all())


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


@app.get("/journal-entries", response_model=list[JournalEntryOut])
def list_journal_entries(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[JournalEntry]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(JournalEntry).order_by(JournalEntry.id.desc())).all())


@app.get("/sales-orders", response_model=list[SalesOrderOut])
def list_sales_orders(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[SalesOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(SalesOrder).order_by(SalesOrder.id.desc())).all())


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
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[CustomerInvoice]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    return list(db.scalars(select(CustomerInvoice).order_by(CustomerInvoice.id.desc())).all())


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


@app.get("/payment-gateway/orders", response_model=list[PaymentGatewayOrderOut])
def list_payment_gateway_orders(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
) -> list[PaymentGatewayOrder]:
    require_role({UserRole.admin, UserRole.accountant}, x_user_role)
    orders = list(db.scalars(select(PaymentGatewayOrder).order_by(PaymentGatewayOrder.id.desc())).all())
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
            select(CustomerInvoice)
            .where(CustomerInvoice.customer_id == customer.id)
            .order_by(CustomerInvoice.id.desc())
        ).all()
    )


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
