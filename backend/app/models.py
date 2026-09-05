from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    admin = "admin"
    accountant = "accountant"
    customer = "customer"


class ContactType(str, Enum):
    customer = "customer"
    vendor = "vendor"
    both = "both"


class ProductType(str, Enum):
    goods = "goods"
    service = "service"
    combo = "combo"


class AccountType(str, Enum):
    asset = "asset"
    liability = "liability"
    income = "income"
    expense = "expense"
    capital = "capital"


class JournalType(str, Enum):
    sales = "sales"
    purchase = "purchase"
    bank = "bank"
    cash = "cash"
    general = "general"


class PurchaseStatus(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    billed = "billed"
    paid = "paid"
    cancelled = "cancelled"


class BillStatus(str, Enum):
    draft = "draft"
    posted = "posted"
    paid = "paid"
    cancelled = "cancelled"


class SalesStatus(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    invoiced = "invoiced"
    paid = "paid"
    cancelled = "cancelled"


class InvoiceStatus(str, Enum):
    draft = "draft"
    posted = "posted"
    paid = "paid"
    cancelled = "cancelled"


class PaymentMethod(str, Enum):
    cash = "cash"
    bank = "bank"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    login_id: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.customer)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_type: Mapped[ContactType] = mapped_column(SAEnum(ContactType), nullable=False)
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(30))
    city: Mapped[str | None] = mapped_column(String(80))
    state: Mapped[str | None] = mapped_column(String(80))
    pincode: Mapped[str | None] = mapped_column(String(20))
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    product_type: Mapped[ProductType] = mapped_column(SAEnum(ProductType), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    sales_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    account_type: Mapped[AccountType] = mapped_column(SAEnum(AccountType), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Journal(Base):
    __tablename__ = "journals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    journal_type: Mapped[JournalType] = mapped_column(SAEnum(JournalType), nullable=False)
    default_debit_account_id: Mapped[int | None] = mapped_column(nullable=True)
    default_credit_account_id: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[PurchaseStatus] = mapped_column(SAEnum(PurchaseStatus), default=PurchaseStatus.draft, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vendor: Mapped[Contact] = relationship()
    lines: Mapped[list["PurchaseOrderLine"]] = relationship(back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    purchase_order: Mapped[PurchaseOrder] = relationship(back_populates="lines")
    product: Mapped[Product] = relationship()


class VendorBill(Base):
    __tablename__ = "vendor_bills"

    id: Mapped[int] = mapped_column(primary_key=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), nullable=False)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    bill_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[BillStatus] = mapped_column(SAEnum(BillStatus), default=BillStatus.draft, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    purchase_order: Mapped[PurchaseOrder] = relationship()
    vendor: Mapped[Contact] = relationship()
    lines: Mapped[list["VendorBillLine"]] = relationship(back_populates="vendor_bill", cascade="all, delete-orphan")


class VendorBillLine(Base):
    __tablename__ = "vendor_bill_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_bill_id: Mapped[int] = mapped_column(ForeignKey("vendor_bills.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    vendor_bill: Mapped[VendorBill] = relationship(back_populates="lines")
    product: Mapped[Product] = relationship()


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_bill_id: Mapped[int] = mapped_column(ForeignKey("vendor_bills.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120))

    vendor_bill: Mapped[VendorBill] = relationship()


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    order_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[SalesStatus] = mapped_column(SAEnum(SalesStatus), default=SalesStatus.draft, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer: Mapped[Contact] = relationship()
    lines: Mapped[list["SalesOrderLine"]] = relationship(back_populates="sales_order", cascade="all, delete-orphan")


class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sales_order: Mapped[SalesOrder] = relationship(back_populates="lines")
    product: Mapped[Product] = relationship()


class CustomerInvoice(Base):
    __tablename__ = "customer_invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    invoice_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(SAEnum(InvoiceStatus), default=InvoiceStatus.draft, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    sales_order: Mapped[SalesOrder] = relationship()
    customer: Mapped[Contact] = relationship()
    lines: Mapped[list["CustomerInvoiceLine"]] = relationship(back_populates="customer_invoice", cascade="all, delete-orphan")


class CustomerInvoiceLine(Base):
    __tablename__ = "customer_invoice_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_invoice_id: Mapped[int] = mapped_column(ForeignKey("customer_invoices.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    customer_invoice: Mapped[CustomerInvoice] = relationship(back_populates="lines")
    product: Mapped[Product] = relationship()


class CustomerPayment(Base):
    __tablename__ = "customer_payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_invoice_id: Mapped[int] = mapped_column(ForeignKey("customer_invoices.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120))

    customer_invoice: Mapped[CustomerInvoice] = relationship()


class PaymentGatewayOrder(Base):
    __tablename__ = "payment_gateway_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_invoice_id: Mapped[int] = mapped_column(ForeignKey("customer_invoices.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(40), default="razorpay", nullable=False)
    provider_order_id: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    provider_payment_id: Mapped[str | None] = mapped_column(String(120))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="created", nullable=False)
    receipt: Mapped[str] = mapped_column(String(120), nullable=False)
    signature: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer_invoice: Mapped[CustomerInvoice] = relationship()


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    journal_id: Mapped[int] = mapped_column(ForeignKey("journals.id"), nullable=False)
    reference: Mapped[str] = mapped_column(String(160), nullable=False)
    entry_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="posted", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    journal: Mapped[Journal] = relationship()
    lines: Mapped[list["JournalEntryLine"]] = relationship(back_populates="journal_entry", cascade="all, delete-orphan")


class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    journal_entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id"), nullable=False)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    partner_id: Mapped[int | None] = mapped_column(ForeignKey("contacts.id"))
    debit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    credit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    journal_entry: Mapped[JournalEntry] = relationship(back_populates="lines")
    account: Mapped[Account] = relationship()
    partner: Mapped[Contact | None] = relationship()
