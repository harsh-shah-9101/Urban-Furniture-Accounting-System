import hashlib
import hmac
import json
import secrets
from base64 import b64encode
from datetime import datetime, timedelta
from decimal import Decimal
from urllib import request
from urllib.error import HTTPError, URLError

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    Account,
    AccountType,
    AnalyticAccount,
    BillStatus,
    Budget,
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
    PaymentGatewayOrder,
    PaymentMethod,
    PaymentStatus,
    PaymentType,
    PasswordResetToken,
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
from app.schemas import (
    AccountCreate,
    AnalyticAccountCreate,
    AnalyticAccountUpdate,
    BudgetCreate,
    BudgetUpdate,
    ContactCreate,
    ContactUpdate,
    JournalCreate,
    JournalUpdate,
    PaymentCreate,
    PaymentRequest,
    PaymentUpdate,
    ProductCreate,
    ProductUpdate,
    PurchaseOrderCreate,
    RazorpayVerifyIn,
    ForgotPasswordIn,
    ResetPasswordIn,
    SalesOrderCreate,
    SignupIn,
    VendorBillDatesIn,
)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return secrets.compare_digest(hash_password(password), password_hash)


def make_token(user: User) -> str:
    return f"demo-token-{user.id}-{user.role.value}"


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


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


def request_password_reset(db: Session, payload: ForgotPasswordIn) -> dict:
    if payload.email:
        user = db.scalar(select(User).where(User.email == str(payload.email)))
    else:
        user = db.scalar(select(User).where(User.login_id == payload.login_id))

    generic_message = "If the account exists, a password reset token has been created"
    if user is None or not user.is_active:
        return {"message": generic_message, "reset_token": None, "expires_at": None}

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: datetime.utcnow()})

    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(reset_token),
            expires_at=expires_at,
        )
    )
    db.commit()
    return {"message": generic_message, "reset_token": reset_token, "expires_at": expires_at}


def reset_password(db: Session, payload: ResetPasswordIn) -> User:
    token_hash = hash_reset_token(payload.reset_token)
    reset_record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    if reset_record is None or reset_record.used_at is not None or reset_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired")

    user = db.get(User, reset_record.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=400, detail="Reset token is invalid or expired")

    user.password_hash = hash_password(payload.password)
    reset_record.used_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def create_contact(db: Session, payload: ContactCreate) -> Contact:
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def _apply_patch(model, payload) -> None:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(model, key, value)


def get_or_404(db: Session, model, item_id: int, label: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return item


def update_model(db: Session, model, item_id: int, payload, label: str):
    item = get_or_404(db, model, item_id, label)
    _apply_patch(item, payload)
    if isinstance(item, Budget):
        item.remaining_amount = item.budget_amount - item.spent_amount
    db.commit()
    db.refresh(item)
    return item


def delete_model(db: Session, model, item_id: int, label: str) -> dict:
    item = get_or_404(db, model, item_id, label)
    if hasattr(item, "archived"):
        item.archived = True
    else:
        db.delete(item)
    db.commit()
    return {"status": "archived" if hasattr(item, "archived") else "deleted", "id": item_id}


def _set_number(instance, field_name: str, prefix: str) -> None:
    year = datetime.utcnow().year
    setattr(instance, field_name, f"{prefix}/{year}/{instance.id:04d}")


def _touch_bill_totals(bill: VendorBill) -> None:
    bill.amount_paid = sum(payment.amount for payment in bill.payments if payment.status == PaymentStatus.confirmed)
    bill.amount_due = max(bill.total_amount - bill.amount_paid, Decimal("0"))
    bill.paid_by_cash = sum(
        payment.amount for payment in bill.payments if payment.status == PaymentStatus.confirmed and payment.method == PaymentMethod.cash
    )
    bill.paid_by_bank = sum(
        payment.amount for payment in bill.payments if payment.status == PaymentStatus.confirmed and payment.method == PaymentMethod.bank
    )
    if bill.status not in {BillStatus.draft, BillStatus.cancelled}:
        bill.status = BillStatus.paid if bill.amount_due == 0 else BillStatus.partially_paid if bill.amount_paid > 0 else BillStatus.posted


def _touch_invoice_totals(invoice: CustomerInvoice) -> None:
    invoice.amount_paid = sum(payment.amount for payment in invoice.payments if payment.status == PaymentStatus.confirmed)
    invoice.amount_due = max(invoice.total_amount - invoice.amount_paid, Decimal("0"))
    invoice.paid_by_cash = sum(
        payment.amount for payment in invoice.payments if payment.status == PaymentStatus.confirmed and payment.method == PaymentMethod.cash
    )
    invoice.paid_by_bank = sum(
        payment.amount for payment in invoice.payments if payment.status == PaymentStatus.confirmed and payment.method == PaymentMethod.bank
    )
    if invoice.status not in {InvoiceStatus.draft, InvoiceStatus.cancelled}:
        invoice.status = InvoiceStatus.paid if invoice.amount_due == 0 else InvoiceStatus.partially_paid if invoice.amount_paid > 0 else InvoiceStatus.posted


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


def create_analytic_account(db: Session, payload: AnalyticAccountCreate) -> AnalyticAccount:
    analytic_account = AnalyticAccount(**payload.model_dump())
    db.add(analytic_account)
    db.commit()
    db.refresh(analytic_account)
    return analytic_account


def create_budget(db: Session, payload: BudgetCreate) -> Budget:
    data = payload.model_dump()
    if data["remaining_amount"] is None:
        data["remaining_amount"] = data["budget_amount"] - data["spent_amount"]
    budget = Budget(**data)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


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
    order = PurchaseOrder(
        vendor_id=payload.vendor_id,
        order_date=payload.order_date or datetime.utcnow(),
        notes=payload.notes,
        total_amount=0,
    )
    db.add(order)
    db.flush()
    _set_number(order, "po_number", "PO")
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
                analytic_account_id=line.analytic_account_id,
                account_id=line.account_id or _account_by_code(db, "5000").id,
            )
        )
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


def cancel_purchase_order(db: Session, order_id: int) -> PurchaseOrder:
    order = get_or_404(db, PurchaseOrder, order_id, "Purchase order")
    if order.status in {PurchaseStatus.billed, PurchaseStatus.paid}:
        raise HTTPException(status_code=400, detail="Billed or paid purchase orders cannot be cancelled")
    order.status = PurchaseStatus.cancelled
    db.commit()
    db.refresh(order)
    return order


def create_vendor_bill_from_po(db: Session, order_id: int, payload: VendorBillDatesIn | None = None) -> VendorBill:
    order = db.get(PurchaseOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if order.status not in {PurchaseStatus.confirmed, PurchaseStatus.billed}:
        raise HTTPException(status_code=400, detail="Purchase order must be confirmed before bill creation")
    existing = db.scalar(select(VendorBill).where(VendorBill.purchase_order_id == order.id))
    if existing:
        if payload and existing.status == BillStatus.draft:
            existing.invoice_date = payload.invoice_date or existing.invoice_date
            existing.due_date = payload.due_date
            db.commit()
            db.refresh(existing)
        return existing

    invoice_date = payload.invoice_date or payload.bill_date if payload and (payload.invoice_date or payload.bill_date) else datetime.utcnow()
    due_date = payload.due_date if payload else None
    if due_date and due_date < invoice_date:
        raise HTTPException(status_code=400, detail="Due date cannot be before invoice date")

    bill = VendorBill(
        purchase_order_id=order.id,
        vendor_id=order.vendor_id,
        bill_reference=payload.bill_reference if payload else None,
        bill_date=invoice_date,
        invoice_date=invoice_date,
        due_date=due_date,
        total_amount=order.total_amount,
        amount_due=order.total_amount,
    )
    db.add(bill)
    db.flush()
    _set_number(bill, "bill_number", "BILL")
    for line in order.lines:
        bill.lines.append(
            VendorBillLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
                analytic_account_id=line.analytic_account_id,
                account_id=line.account_id or _account_by_code(db, "5000").id,
            )
        )
    order.status = PurchaseStatus.billed
    db.commit()
    db.refresh(bill)
    return bill


def update_vendor_bill_dates(db: Session, bill_id: int, payload: VendorBillDatesIn) -> VendorBill:
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if bill.status != BillStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft vendor bills can be edited")

    invoice_date = payload.invoice_date or payload.bill_date or bill.invoice_date
    if payload.due_date and payload.due_date < invoice_date:
        raise HTTPException(status_code=400, detail="Due date cannot be before invoice date")

    bill.invoice_date = invoice_date
    bill.due_date = payload.due_date
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
    source_type: str | None = None,
    source_id: int | None = None,
) -> JournalEntry:
    entry = JournalEntry(journal_id=journal.id, reference=reference, source_type=source_type, source_id=source_id)
    entry.lines = [
        JournalEntryLine(account_id=debit_account.id, partner_id=partner_id, debit=amount, credit=0),
        JournalEntryLine(account_id=credit_account.id, partner_id=partner_id, debit=0, credit=amount),
    ]
    if sum(line.debit for line in entry.lines) != sum(line.credit for line in entry.lines):
        raise HTTPException(status_code=400, detail="Journal entry debit and credit must match")
    db.add(entry)
    db.flush()
    return entry


def post_vendor_bill(db: Session, bill_id: int) -> VendorBill:
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if bill.status != BillStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft vendor bills can be posted")

    entry = _create_journal_entry(
        db,
        journal=_journal_by_type(db, JournalType.purchase),
        reference=f"Vendor Bill #{bill.id}",
        debit_account=_account_by_code(db, "5000"),
        credit_account=_account_by_code(db, "2000"),
        amount=bill.total_amount,
        partner_id=bill.vendor_id,
        source_type="vendor_bill",
        source_id=bill.id,
    )
    bill.journal_entry_id = entry.id
    bill.amount_due = bill.total_amount
    bill.status = BillStatus.posted
    db.commit()
    db.refresh(bill)
    return bill


def cancel_vendor_bill(db: Session, bill_id: int) -> VendorBill:
    bill = get_or_404(db, VendorBill, bill_id, "Vendor bill")
    if bill.status in {BillStatus.paid, BillStatus.partially_paid}:
        raise HTTPException(status_code=400, detail="Paid vendor bills cannot be cancelled")
    bill.status = BillStatus.cancelled
    db.commit()
    db.refresh(bill)
    return bill


def pay_vendor_bill(db: Session, bill_id: int, payload: PaymentCreate) -> Payment:
    bill = db.get(VendorBill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if bill.status not in {BillStatus.posted, BillStatus.partially_paid}:
        raise HTTPException(status_code=400, detail="Only posted vendor bills can be paid")

    _touch_bill_totals(bill)
    amount = payload.amount or bill.amount_due
    if amount <= 0 or amount > bill.amount_due:
        raise HTTPException(status_code=400, detail="Payment amount must be between 0 and amount due")
    payment = Payment(
        vendor_bill_id=bill.id,
        partner_id=bill.vendor_id,
        payment_type=PaymentType.send,
        amount=amount,
        method=payload.method,
        reference=payload.reference,
        note=payload.note,
        status=PaymentStatus.confirmed,
    )
    db.add(payment)
    db.flush()
    _set_number(payment, "payment_number", "PAY")
    cash_or_bank_code = "1000" if payload.method == PaymentMethod.cash else "1010"
    journal_type = JournalType.cash if payload.method == PaymentMethod.cash else JournalType.bank
    entry = _create_journal_entry(
        db,
        journal=_journal_by_type(db, journal_type),
        reference=f"Payment for Vendor Bill #{bill.id}",
        debit_account=_account_by_code(db, "2000"),
        credit_account=_account_by_code(db, cash_or_bank_code),
        amount=amount,
        partner_id=bill.vendor_id,
        source_type="payment",
        source_id=payment.id,
    )
    payment.journal_entry_id = entry.id
    _touch_bill_totals(bill)
    if bill.status == BillStatus.paid:
        bill.purchase_order.status = PurchaseStatus.paid
    db.commit()
    db.refresh(payment)
    return payment


def create_sales_order(db: Session, payload: SalesOrderCreate) -> SalesOrder:
    _validate_customer(db, payload.customer_id)
    order = SalesOrder(
        customer_id=payload.customer_id,
        order_date=payload.order_date or datetime.utcnow(),
        notes=payload.notes,
        total_amount=0,
    )
    db.add(order)
    db.flush()
    _set_number(order, "so_number", "SO")
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
                analytic_account_id=line.analytic_account_id,
                account_id=line.account_id or _account_by_code(db, "4000").id,
            )
        )
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


def cancel_sales_order(db: Session, order_id: int) -> SalesOrder:
    order = get_or_404(db, SalesOrder, order_id, "Sales order")
    if order.status in {SalesStatus.invoiced, SalesStatus.paid}:
        raise HTTPException(status_code=400, detail="Invoiced or paid sales orders cannot be cancelled")
    order.status = SalesStatus.cancelled
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

    invoice = CustomerInvoice(
        sales_order_id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        amount_due=order.total_amount,
    )
    db.add(invoice)
    db.flush()
    _set_number(invoice, "invoice_number", "INV")
    for line in order.lines:
        invoice.lines.append(
            CustomerInvoiceLine(
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
                analytic_account_id=line.analytic_account_id,
                account_id=line.account_id or _account_by_code(db, "4000").id,
            )
        )
    order.status = SalesStatus.invoiced
    db.commit()
    db.refresh(invoice)
    return invoice


def post_customer_invoice(db: Session, invoice_id: int) -> CustomerInvoice:
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.status != InvoiceStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft customer invoices can be posted")

    entry = _create_journal_entry(
        db,
        journal=_journal_by_type(db, JournalType.sales),
        reference=f"Customer Invoice #{invoice.id}",
        debit_account=_account_by_code(db, "1100"),
        credit_account=_account_by_code(db, "4000"),
        amount=invoice.total_amount,
        partner_id=invoice.customer_id,
        source_type="customer_invoice",
        source_id=invoice.id,
    )
    invoice.journal_entry_id = entry.id
    invoice.amount_due = invoice.total_amount
    invoice.status = InvoiceStatus.posted
    db.commit()
    db.refresh(invoice)
    return invoice


def cancel_customer_invoice(db: Session, invoice_id: int) -> CustomerInvoice:
    invoice = get_or_404(db, CustomerInvoice, invoice_id, "Customer invoice")
    if invoice.status in {InvoiceStatus.paid, InvoiceStatus.partially_paid}:
        raise HTTPException(status_code=400, detail="Paid customer invoices cannot be cancelled")
    invoice.status = InvoiceStatus.cancelled
    db.commit()
    db.refresh(invoice)
    return invoice


def pay_customer_invoice(db: Session, invoice_id: int, payload: PaymentCreate) -> CustomerPayment:
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.status not in {InvoiceStatus.posted, InvoiceStatus.partially_paid}:
        raise HTTPException(status_code=400, detail="Only posted customer invoices can be paid")

    _touch_invoice_totals(invoice)
    amount = payload.amount or invoice.amount_due
    if amount <= 0 or amount > invoice.amount_due:
        raise HTTPException(status_code=400, detail="Payment amount must be between 0 and amount due")
    payment = Payment(
        customer_invoice_id=invoice.id,
        partner_id=invoice.customer_id,
        payment_type=PaymentType.receive,
        amount=amount,
        method=payload.method,
        reference=payload.reference,
        note=payload.note,
        status=PaymentStatus.confirmed,
    )
    db.add(payment)
    db.flush()
    _set_number(payment, "payment_number", "PAY")
    cash_or_bank_code = "1000" if payload.method == PaymentMethod.cash else "1010"
    journal_type = JournalType.cash if payload.method == PaymentMethod.cash else JournalType.bank
    entry = _create_journal_entry(
        db,
        journal=_journal_by_type(db, journal_type),
        reference=f"Payment for Customer Invoice #{invoice.id}",
        debit_account=_account_by_code(db, cash_or_bank_code),
        credit_account=_account_by_code(db, "1100"),
        amount=amount,
        partner_id=invoice.customer_id,
        source_type="payment",
        source_id=payment.id,
    )
    payment.journal_entry_id = entry.id
    customer_payment = CustomerPayment(
        customer_invoice_id=invoice.id,
        amount=amount,
        method=payload.method,
        reference=payload.reference,
        payment_id=payment.id,
    )
    db.add(customer_payment)
    _touch_invoice_totals(invoice)
    if invoice.status == InvoiceStatus.paid:
        invoice.sales_order.status = SalesStatus.paid
    db.commit()
    db.refresh(customer_payment)
    return customer_payment


def create_payment(db: Session, payload: PaymentRequest) -> Payment:
    partner = db.get(Contact, payload.partner_id)
    if partner is None:
        raise HTTPException(status_code=404, detail="Partner not found")
    if payload.vendor_bill_id and payload.customer_invoice_id:
        raise HTTPException(status_code=400, detail="Payment can link to either vendor bill or customer invoice, not both")
    if payload.payment_type == PaymentType.send and payload.customer_invoice_id:
        raise HTTPException(status_code=400, detail="Send payment cannot link to customer invoice")
    if payload.payment_type == PaymentType.receive and payload.vendor_bill_id:
        raise HTTPException(status_code=400, detail="Receive payment cannot link to vendor bill")
    if payload.vendor_bill_id and db.get(VendorBill, payload.vendor_bill_id) is None:
        raise HTTPException(status_code=404, detail="Vendor bill not found")
    if payload.customer_invoice_id and db.get(CustomerInvoice, payload.customer_invoice_id) is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")

    payment = Payment(**payload.model_dump(exclude={"payment_date"}), payment_date=payload.payment_date or datetime.utcnow())
    db.add(payment)
    db.flush()
    _set_number(payment, "payment_number", "PAY")
    db.commit()
    db.refresh(payment)
    return payment


def update_payment(db: Session, payment_id: int, payload: PaymentUpdate) -> Payment:
    payment = get_or_404(db, Payment, payment_id, "Payment")
    if payment.status != PaymentStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft payments can be edited")
    _apply_patch(payment, payload)
    db.commit()
    db.refresh(payment)
    return payment


def confirm_payment(db: Session, payment_id: int) -> Payment:
    payment = get_or_404(db, Payment, payment_id, "Payment")
    if payment.status != PaymentStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft payments can be confirmed")

    if payment.payment_type == PaymentType.send:
        bill = payment.vendor_bill
        if bill is None:
            raise HTTPException(status_code=400, detail="Send payment requires vendor_bill_id")
        if bill.status not in {BillStatus.posted, BillStatus.partially_paid}:
            raise HTTPException(status_code=400, detail="Vendor bill must be posted before payment")
        _touch_bill_totals(bill)
        if payment.amount <= 0 or payment.amount > bill.amount_due:
            raise HTTPException(status_code=400, detail="Payment amount must be between 0 and amount due")
        debit_account = _account_by_code(db, "2000")
        credit_account = _account_by_code(db, "1000" if payment.method == PaymentMethod.cash else "1010")
        journal_type = JournalType.cash if payment.method == PaymentMethod.cash else JournalType.bank
        partner_id = bill.vendor_id
    else:
        invoice = payment.customer_invoice
        if invoice is None:
            raise HTTPException(status_code=400, detail="Receive payment requires customer_invoice_id")
        if invoice.status not in {InvoiceStatus.posted, InvoiceStatus.partially_paid}:
            raise HTTPException(status_code=400, detail="Customer invoice must be posted before payment")
        _touch_invoice_totals(invoice)
        if payment.amount <= 0 or payment.amount > invoice.amount_due:
            raise HTTPException(status_code=400, detail="Payment amount must be between 0 and amount due")
        debit_account = _account_by_code(db, "1000" if payment.method == PaymentMethod.cash else "1010")
        credit_account = _account_by_code(db, "1100")
        journal_type = JournalType.cash if payment.method == PaymentMethod.cash else JournalType.bank
        partner_id = invoice.customer_id

    payment.status = PaymentStatus.confirmed
    entry = _create_journal_entry(
        db,
        journal=_journal_by_type(db, journal_type),
        reference=f"Payment #{payment.id}",
        debit_account=debit_account,
        credit_account=credit_account,
        amount=payment.amount,
        partner_id=partner_id,
        source_type="payment",
        source_id=payment.id,
    )
    payment.journal_entry_id = entry.id

    if payment.vendor_bill:
        _touch_bill_totals(payment.vendor_bill)
        if payment.vendor_bill.status == BillStatus.paid:
            payment.vendor_bill.purchase_order.status = PurchaseStatus.paid
    if payment.customer_invoice:
        customer_payment = CustomerPayment(
            customer_invoice_id=payment.customer_invoice.id,
            amount=payment.amount,
            method=payment.method,
            reference=payment.reference,
            payment_id=payment.id,
        )
        db.add(customer_payment)
        _touch_invoice_totals(payment.customer_invoice)
        if payment.customer_invoice.status == InvoiceStatus.paid:
            payment.customer_invoice.sales_order.status = SalesStatus.paid

    db.commit()
    db.refresh(payment)
    return payment


def cancel_payment(db: Session, payment_id: int) -> Payment:
    payment = get_or_404(db, Payment, payment_id, "Payment")
    if payment.status == PaymentStatus.confirmed:
        raise HTTPException(status_code=400, detail="Confirmed payments cannot be cancelled without reversal entry")
    payment.status = PaymentStatus.cancelled
    db.commit()
    db.refresh(payment)
    return payment


def reset_payment_to_draft(db: Session, payment_id: int) -> Payment:
    payment = get_or_404(db, Payment, payment_id, "Payment")
    if payment.status != PaymentStatus.cancelled:
        raise HTTPException(status_code=400, detail="Only cancelled payments can be reset to draft")
    payment.status = PaymentStatus.draft
    db.commit()
    db.refresh(payment)
    return payment


def _amount_to_paise(amount: Decimal) -> int:
    return int((amount * 100).quantize(Decimal("1")))


def _create_razorpay_order(invoice: CustomerInvoice, receipt: str) -> dict:
    amount_paise = _amount_to_paise(invoice.total_amount)
    payload = {
        "amount": amount_paise,
        "currency": settings.payment_currency,
        "receipt": receipt,
    }
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        return {
            "id": f"demo_order_{invoice.id}_{secrets.token_hex(6)}",
            "amount": amount_paise,
            "currency": settings.payment_currency,
            "receipt": receipt,
            "status": "created",
        }

    body = json.dumps(payload).encode("utf-8")
    token = b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode("utf-8")).decode("ascii")
    http_request = request.Request(
        "https://api.razorpay.com/v1/orders",
        data=body,
        headers={
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(http_request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Razorpay connection failed: {exc.reason}") from exc


def create_customer_invoice_payment_order(db: Session, invoice_id: int) -> PaymentGatewayOrder:
    invoice = db.get(CustomerInvoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")
    if invoice.status != InvoiceStatus.posted:
        raise HTTPException(status_code=400, detail="Only posted customer invoices can start online payment")

    existing = db.scalar(
        select(PaymentGatewayOrder).where(
            PaymentGatewayOrder.customer_invoice_id == invoice.id,
            PaymentGatewayOrder.status == "created",
        )
    )
    if existing:
        return existing

    receipt = f"invoice_{invoice.id}"
    razorpay_order = _create_razorpay_order(invoice, receipt)
    gateway_order = PaymentGatewayOrder(
        customer_invoice_id=invoice.id,
        provider="razorpay",
        provider_order_id=razorpay_order["id"],
        amount=invoice.total_amount,
        currency=razorpay_order.get("currency", settings.payment_currency),
        status=razorpay_order.get("status", "created"),
        receipt=razorpay_order.get("receipt", receipt),
    )
    db.add(gateway_order)
    db.commit()
    db.refresh(gateway_order)
    return gateway_order


def verify_razorpay_payment(db: Session, payload: RazorpayVerifyIn) -> tuple[CustomerInvoice, CustomerPayment | None, PaymentGatewayOrder]:
    gateway_order = db.scalar(
        select(PaymentGatewayOrder).where(PaymentGatewayOrder.provider_order_id == payload.razorpay_order_id)
    )
    if gateway_order is None:
        raise HTTPException(status_code=404, detail="Payment order not found")

    if settings.razorpay_key_secret:
        message = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            settings.razorpay_key_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()
        if not secrets.compare_digest(expected_signature, payload.razorpay_signature):
            gateway_order.status = "failed"
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")
    elif payload.razorpay_signature != "demo":
        raise HTTPException(status_code=400, detail="Demo mode expects razorpay_signature='demo'")

    invoice = db.get(CustomerInvoice, gateway_order.customer_invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Customer invoice not found")

    payment = None
    if invoice.status == InvoiceStatus.posted:
        payment = pay_customer_invoice(
            db,
            invoice.id,
            PaymentCreate(
                method=PaymentMethod.bank,
                amount=gateway_order.amount,
                reference=payload.razorpay_payment_id,
            ),
        )
        db.refresh(gateway_order)
    elif invoice.status != InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice cannot be marked paid from current status")

    gateway_order.provider_payment_id = payload.razorpay_payment_id
    gateway_order.signature = payload.razorpay_signature
    gateway_order.status = "paid"
    db.commit()
    db.refresh(gateway_order)
    db.refresh(invoice)
    return invoice, payment, gateway_order


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
