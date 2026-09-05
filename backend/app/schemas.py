from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models import (
    AccountType,
    BillStatus,
    ContactType,
    InvoiceStatus,
    JournalType,
    PaymentMethod,
    ProductType,
    PurchaseStatus,
    SalesStatus,
    UserRole,
)


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    login_id: str = Field(min_length=6, max_length=12, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)
    role: UserRole = UserRole.customer

    @model_validator(mode="after")
    def passwords_match(self) -> "SignupIn":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class LoginIn(BaseModel):
    email: EmailStr | None = None
    login_id: str | None = None
    password: str

    @model_validator(mode="after")
    def email_or_login_id_required(self) -> "LoginIn":
        if not self.email and not self.login_id:
            raise ValueError("Enter either email or login ID")
        return self


class UserOut(BaseModel):
    id: int
    name: str
    login_id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthOut(BaseModel):
    user: UserOut
    access_token: str


class ContactCreate(BaseModel):
    name: str = Field(min_length=2)
    contact_type: ContactType
    email: EmailStr
    mobile: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    profile_image_url: str | None = None


class ContactOut(ContactCreate):
    id: int

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(min_length=2)
    product_type: ProductType
    category: str
    sales_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(ge=0)
    image_url: str | None = None


class ProductOut(ProductCreate):
    id: int

    model_config = {"from_attributes": True}


class AccountCreate(BaseModel):
    code: str = Field(min_length=2, max_length=20)
    name: str = Field(min_length=2)
    account_type: AccountType


class AccountOut(AccountCreate):
    id: int

    model_config = {"from_attributes": True}


class JournalCreate(BaseModel):
    name: str = Field(min_length=2)
    journal_type: JournalType
    default_debit_account_id: int | None = None
    default_credit_account_id: int | None = None


class JournalOut(JournalCreate):
    id: int

    model_config = {"from_attributes": True}


class PurchaseOrderLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    notes: str | None = None
    lines: list[PurchaseOrderLineCreate] = Field(min_length=1)


class PurchaseOrderLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class PurchaseOrderOut(BaseModel):
    id: int
    vendor_id: int
    status: PurchaseStatus
    total_amount: Decimal
    notes: str | None
    lines: list[PurchaseOrderLineOut]

    model_config = {"from_attributes": True}


class VendorBillLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class VendorBillOut(BaseModel):
    id: int
    purchase_order_id: int
    vendor_id: int
    status: BillStatus
    total_amount: Decimal
    lines: list[VendorBillLineOut]

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    method: PaymentMethod
    amount: Decimal | None = Field(default=None, ge=0)
    reference: str | None = None


class PaymentOut(BaseModel):
    id: int
    vendor_bill_id: int
    amount: Decimal
    method: PaymentMethod
    reference: str | None

    model_config = {"from_attributes": True}


class SalesOrderLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class SalesOrderCreate(BaseModel):
    customer_id: int
    notes: str | None = None
    lines: list[SalesOrderLineCreate] = Field(min_length=1)


class SalesOrderLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class SalesOrderOut(BaseModel):
    id: int
    customer_id: int
    status: SalesStatus
    total_amount: Decimal
    notes: str | None
    lines: list[SalesOrderLineOut]

    model_config = {"from_attributes": True}


class CustomerInvoiceLineOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class CustomerInvoiceOut(BaseModel):
    id: int
    sales_order_id: int
    customer_id: int
    status: InvoiceStatus
    total_amount: Decimal
    lines: list[CustomerInvoiceLineOut]

    model_config = {"from_attributes": True}


class CustomerPaymentOut(BaseModel):
    id: int
    customer_invoice_id: int
    amount: Decimal
    method: PaymentMethod
    reference: str | None

    model_config = {"from_attributes": True}


class PaymentGatewayOrderOut(BaseModel):
    id: int
    customer_invoice_id: int
    provider: str
    provider_order_id: str
    amount: Decimal
    currency: str
    status: str
    receipt: str
    key_id: str | None = None

    model_config = {"from_attributes": True}


class RazorpayVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RazorpayVerifyOut(BaseModel):
    verified: bool
    invoice: CustomerInvoiceOut
    payment: CustomerPaymentOut | None = None
    gateway_order: PaymentGatewayOrderOut


class JournalEntryLineOut(BaseModel):
    id: int
    account_id: int
    partner_id: int | None
    debit: Decimal
    credit: Decimal

    model_config = {"from_attributes": True}


class JournalEntryOut(BaseModel):
    id: int
    journal_id: int
    reference: str
    status: str
    lines: list[JournalEntryLineOut]

    model_config = {"from_attributes": True}


class TrialBalanceLineOut(BaseModel):
    account_id: int
    code: str
    name: str
    account_type: AccountType
    debit: Decimal
    credit: Decimal
    balance: Decimal


class ProfitLossOut(BaseModel):
    income: Decimal
    expense: Decimal
    net_profit: Decimal


class BalanceSheetOut(BaseModel):
    assets: Decimal
    liabilities: Decimal
    capital: Decimal
    net_profit: Decimal
    difference: Decimal


class BudgetReportOut(BaseModel):
    target_income: Decimal
    actual_income: Decimal
    income_variance: Decimal
    budgeted_expense: Decimal
    actual_expense: Decimal
    expense_variance: Decimal
    net_profit: Decimal
