from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import Account, Contact, Journal, JournalEntry, Product, PurchaseOrder, UserRole, VendorBill
from app.schemas import (
    AccountCreate,
    AccountOut,
    AuthOut,
    ContactCreate,
    ContactOut,
    JournalCreate,
    JournalEntryOut,
    JournalOut,
    LoginIn,
    PaymentCreate,
    PaymentOut,
    ProductCreate,
    ProductOut,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    SignupIn,
    VendorBillOut,
)
from app.services import (
    authenticate_user,
    create_account,
    create_contact,
    create_journal,
    create_product,
    create_purchase_order,
    create_user,
    create_vendor_bill_from_po,
    confirm_purchase_order,
    make_token,
    pay_vendor_bill,
    post_vendor_bill,
    seed,
)

app = FastAPI(title="Urban Furniture Accounting API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
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
        "next_modules": ["purchase", "vendor_bill", "sales", "customer_invoice", "payments", "reports"],
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
