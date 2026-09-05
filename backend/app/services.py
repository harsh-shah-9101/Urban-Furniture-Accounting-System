import hashlib
import secrets

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import (
    Account,
    AccountType,
    BillStatus,
    Contact,
    ContactType,
    CustomerInvoice,
    CustomerInvoiceLine,
    CustomerPayment,
    Journal,
    JournalType,
    JournalEntry,
    JournalEntryLine,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    Product,
    ProductType,
    PurchaseOrder,
    PurchaseOrderLine,
    PurchaseStatus,
    SalesOrder,
    SalesOrderLine,
    SalesStatus,
    User,
    UserRole,
    VendorBill,
    VendorBillLine,
)
from app.schemas import AccountCreate, ContactCreate, JournalCreate, PaymentCreate, ProductCreate, PurchaseOrderCreate, SalesOrderCreate, SignupIn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return secrets.compare_digest(hash_password(password), password_hash)


def make_token(user: User) -> str:
    return f"demo-token-{user.id}-{user.role.value}"


def create_user(db: Session, payload: SignupIn) -> User:
    existing = db.scalar(select(User).where(or_(User.login_id == payload.login_id, User.email == str(payload.email))))
    if existing:
        raise HTTPException(status_code=409, detail="Login ID or email already exists")

    user = User(
        name=payload.name,
        login_id=payload.login_id,
        email=str(payload.email),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, password: str, email: str | None = None, login_id: str | None = None) -> User:
    if email:
        user = db.scalar(select(User).where(User.email == email))
    else:
        user = db.scalar(select(User).where(User.login_id == login_id))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return user


def create_contact(db: Session, payload: ContactCreate) -> Contact:
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def create_account(db: Session, payload: AccountCreate) -> Account:
    account = Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def create_journal(db: Session, payload: JournalCreate) -> Journal:
    journal = Journal(**payload.model_dump())
    db.add(journal)
    db.commit()
    db.refresh(journal)
    return journal


def _account_by_code(db: Session, code: str) -> Account:
    account = db.scalar(select(Account).where(Account.code == code))
    if account is None:
        raise HTTPException(status_code=400, detail=f"Required account {code} is missing")
    return account


def _journal_by_type(db: Session, journal_type: JournalType) -> Journal:
    journal = db.scalar(select(Journal).where(Journal.journal_type == journal_type))
    if journal is None:
        raise HTTPException(status_code=400, detail=f"Required {journal_type.value} journal is missing")
    return journal


def _validate_vendor(db: Session, vendor_id: int) -> Contact:
    vendor = db.get(Contact, vendor_id)
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.contact_type not in {ContactType.vendor, ContactType.both}:
        raise HTTPException(status_code=400, detail="Contact must be a vendor")
    return vendor


def _validate_customer(db: Session, customer_id: int) -> Contact:
    customer = db.get(Contact, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.contact_type not in {ContactType.customer, ContactType.both}:
        raise HTTPException(status_code=400, detail="Contact must be a customer")
    return customer


def create_purchase_order(db: Session, payload: PurchaseOrderCreate) -> PurchaseOrder:
    _validate_vendor(db, payload.vendor_id)
    order = PurchaseOrder(vendor_id=payload.vendor_id, notes=payload.notes, total_amount=0)
    for line in payload.lines:
        product = db.get(Product, line.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {line.product_id} not found")
        line_total = line.quantity * line.unit_price
        order.total_amount += line_total
        order.lines.append(
            PurchaseOrderLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line_total,
            )
        )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def confirm_purchase_order(db: Session, order_id: int) -> PurchaseOrder:
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if order.status != PurchaseStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft purchase orders can be confirmed")
    order.status = PurchaseStatus.confirmed
    db.commit()
    db.refresh(order)
    return order


def create_vendor_bill_from_po(db: Session, order_id: int) -> VendorBill:
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if order.status not in {PurchaseStatus.confirmed, PurchaseStatus.billed}:
        raise HTTPException(status_code=400, detail="Purchase order must be confirmed before bill creation")
    existing = db.scalar(select(VendorBill).where(VendorBill.purchase_order_id == order.id))
    if existing:
        return existing

    bill = VendorBill(purchase_order_id=order.id, vendor_id=order.vendor_id, total_amount=order.total_amount)
    for line in order.lines:
        bill.lines.append(
            VendorBillLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
            )
        )
    order.status = PurchaseStatus.billed
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


def _create_journal_entry(
    db: Session,
    journal: Journal,
    reference: str,
    debit_account: Account,
    credit_account: Account,
    amount,
    partner_id: int | None = None,
) -> JournalEntry:
    entry = JournalEntry(journal_id=journal.id, reference=reference)
    entry.lines = [
        JournalEntryLine(account_id=debit_account.id, partner_id=partner_id, debit=amount, credit=0),
        JournalEntryLine(account_id=credit_account.id, partner_id=partner_id, debit=0, credit=amount),
    ]
    if sum(line.debit for line in entry.lines) != sum(line.credit for line in entry.lines):
        raise HTTPException(status_code=400, detail="Journal entry debit and credit must match")
    db.add(entry)
    return entry


def post_vendor_bill(db: Session, bill_id: int) -> VendorBill:
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if bill.status != BillStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft vendor bills can be posted")

    _create_journal_entry(
        db,
        journal=_journal_by_type(db, JournalType.purchase),
        reference=f"Vendor Bill #{bill.id}",
        debit_account=_account_by_code(db, "5000"),
        credit_account=_account_by_code(db, "2000"),
        amount=bill.total_amount,
        partner_id=bill.vendor_id,
    )
    bill.status = BillStatus.posted
    db.commit()
    db.refresh(bill)
    return bill


def pay_vendor_bill(db: Session, bill_id: int, payload: PaymentCreate) -> Payment:
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if bill.status != BillStatus.posted:
        raise HTTPException(status_code=400, detail="Only posted vendor bills can be paid")

    amount = payload.amount or bill.total_amount
    payment = Payment(vendor_bill_id=bill.id, amount=amount, method=payload.method, reference=payload.reference)
    cash_or_bank_code = "1000" if payload.method == PaymentMethod.cash else "1010"
    journal_type = JournalType.cash if payload.method == PaymentMethod.cash else JournalType.bank
    _create_journal_entry(
        db,
        journal=_journal_by_type(db, journal_type),
        reference=f"Payment for Vendor Bill #{bill.id}",
        debit_account=_account_by_code(db, "2000"),
        credit_account=_account_by_code(db, cash_or_bank_code),
        amount=amount,
        partner_id=bill.vendor_id,
    )
    bill.status = BillStatus.paid
    bill.purchase_order.status = PurchaseStatus.paid
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def create_sales_order(db: Session, payload: SalesOrderCreate) -> SalesOrder:
    _validate_customer(db, payload.customer_id)
    order = SalesOrder(customer_id=payload.customer_id, notes=payload.notes, total_amount=0)
    for line in payload.lines:
        product = db.get(Product, line.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {line.product_id} not found")
        line_total = line.quantity * line.unit_price
        order.total_amount += line_total
        order.lines.append(
            SalesOrderLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line_total,
            )
        )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def confirm_sales_order(db: Session, order_id: int) -> SalesOrder:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if order.status != SalesStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft sales orders can be confirmed")
    order.status = SalesStatus.confirmed
    db.commit()
    db.refresh(order)
    return order


def create_customer_invoice_from_so(db: Session, order_id: int) -> CustomerInvoice:
    order = db.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if order.status not in {SalesStatus.confirmed, SalesStatus.invoiced}:
        raise HTTPException(status_code=400, detail="Sales order must be confirmed before invoice creation")
    existing = db.scalar(select(CustomerInvoice).where(CustomerInvoice.sales_order_id == order.id))
    if existing:
        return existing

    invoice = CustomerInvoice(sales_order_id=order.id, customer_id=order.customer_id, total_amount=order.total_amount)
    for line in order.lines:
        invoice.lines.append(
            CustomerInvoiceLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
            )
        )
    order.status = SalesStatus.invoiced
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def post_customer_invoice(db: Session, invoice_id: int) -> CustomerInvoice:
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.status != InvoiceStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft customer invoices can be posted")

    _create_journal_entry(
        db,
        journal=_journal_by_type(db, JournalType.sales),
        reference=f"Customer Invoice #{invoice.id}",
        debit_account=_account_by_code(db, "1100"),
        credit_account=_account_by_code(db, "4000"),
        amount=invoice.total_amount,
        partner_id=invoice.customer_id,
    )
    invoice.status = InvoiceStatus.posted
    db.commit()
    db.refresh(invoice)
    return invoice


def pay_customer_invoice(db: Session, invoice_id: int, payload: PaymentCreate) -> CustomerPayment:
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.status != InvoiceStatus.posted:
        raise HTTPException(status_code=400, detail="Only posted customer invoices can be paid")

    amount = payload.amount or invoice.total_amount
    payment = CustomerPayment(
        customer_invoice_id=invoice.id,
        amount=amount,
        method=payload.method,
        reference=payload.reference,
    )
    cash_or_bank_code = "1000" if payload.method == PaymentMethod.cash else "1010"
    journal_type = JournalType.cash if payload.method == PaymentMethod.cash else JournalType.bank
    _create_journal_entry(
        db,
        journal=_journal_by_type(db, journal_type),
        reference=f"Payment for Customer Invoice #{invoice.id}",
        debit_account=_account_by_code(db, cash_or_bank_code),
        credit_account=_account_by_code(db, "1100"),
        amount=amount,
        partner_id=invoice.customer_id,
    )
    invoice.status = InvoiceStatus.paid
    invoice.sales_order.status = SalesStatus.paid
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def trial_balance(db: Session) -> list[dict]:
    rows = []
    accounts = db.scalars(select(Account).order_by(Account.code)).all()
    for account in accounts:
        lines = db.scalars(select(JournalEntryLine).where(JournalEntryLine.account_id == account.id)).all()
        debit = sum(line.debit for line in lines)
        credit = sum(line.credit for line in lines)
        rows.append(
            {
                "account_id": account.id,
                "code": account.code,
                "name": account.name,
                "account_type": account.account_type,
                "debit": debit,
                "credit": credit,
                "balance": debit - credit,
            }
        )
    return rows


def profit_and_loss(db: Session) -> dict:
    rows = trial_balance(db)
    income = sum(abs(row["balance"]) for row in rows if row["account_type"] == AccountType.income)
    expense = sum(row["balance"] for row in rows if row["account_type"] == AccountType.expense)
    return {"income": income, "expense": expense, "net_profit": income - expense}


def balance_sheet(db: Session) -> dict:
    rows = trial_balance(db)
    pl = profit_and_loss(db)
    assets = sum(row["balance"] for row in rows if row["account_type"] == AccountType.asset)
    liabilities = sum(abs(row["balance"]) for row in rows if row["account_type"] == AccountType.liability)
    capital = sum(abs(row["balance"]) for row in rows if row["account_type"] == AccountType.capital)
    right_side = liabilities + capital + pl["net_profit"]
    return {
        "assets": assets,
        "liabilities": liabilities,
        "capital": capital,
        "net_profit": pl["net_profit"],
        "difference": assets - right_side,
    }


def seed(db: Session) -> None:
    if db.scalar(select(User).limit(1)):
        return

    db.add_all(
        [
            User(
                name="Admin User",
                login_id="admin01",
                email="admin@urbanbooksapp.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.admin,
            ),
            User(
                name="Accountant",
                login_id="acct01",
                email="accountant@urbanbooksapp.com",
                password_hash=hash_password("Account@123"),
                role=UserRole.accountant,
            ),
            User(
                name="Nimesh Pathak",
                login_id="nimesh01",
                email="nimesh@example.com",
                password_hash=hash_password("Nimesh@123"),
                role=UserRole.customer,
            ),
            Account(code="1000", name="Cash", account_type=AccountType.asset),
            Account(code="1010", name="Bank", account_type=AccountType.asset),
            Account(code="1100", name="Debtors", account_type=AccountType.asset),
            Account(code="2000", name="Creditors", account_type=AccountType.liability),
            Account(code="3000", name="Capital", account_type=AccountType.capital),
            Account(code="4000", name="Sales Income", account_type=AccountType.income),
            Account(code="5000", name="Purchase Expense", account_type=AccountType.expense),
            Contact(
                name="Azure Furniture",
                contact_type=ContactType.vendor,
                email="vendor@azure.example",
                mobile="9876543210",
                city="Mumbai",
                state="Maharashtra",
                pincode="400001",
            ),
            Contact(
                name="Nimesh Pathak",
                contact_type=ContactType.customer,
                email="nimesh@example.com",
                mobile="9123456780",
                city="Pune",
                state="Maharashtra",
                pincode="411001",
            ),
            Product(
                name="Office Chair",
                product_type=ProductType.goods,
                category="Furniture",
                sales_price=7500,
                cost_price=5200,
            ),
            Product(
                name="Wooden Table",
                product_type=ProductType.goods,
                category="Furniture",
                sales_price=15000,
                cost_price=10000,
            ),
            Product(
                name="Installation Service",
                product_type=ProductType.service,
                category="Service",
                sales_price=2500,
                cost_price=1200,
            ),
            Journal(name="Sales Journal", journal_type=JournalType.sales),
            Journal(name="Purchase Journal", journal_type=JournalType.purchase),
            Journal(name="Bank Journal", journal_type=JournalType.bank),
            Journal(name="Cash Journal", journal_type=JournalType.cash),
        ]
    )
    db.commit()
