from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models import (
    AccountType,
    BillStatus,
    ContactType,
    InvoiceStatus,
    JournalType,
    PaymentMethod,
    PaymentStatus,
    PaymentType,
    ProductType,
    PurchaseStatus,
    SalesStatus,
    UserRole,
)


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")


class SignupIn(ApiModel):
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


class LoginIn(ApiModel):
    email: EmailStr | None = None
    login_id: str | None = None
    password: str

    @model_validator(mode="after")
    def email_or_login_id_required(self) -> "LoginIn":
        if not self.email and not self.login_id:
            raise ValueError("Enter either email or login ID")
        return self


class UserOut(ApiModel):
    id: int
    name: str
    login_id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

class AuthOut(ApiModel):
    user: UserOut
    access_token: str


class ForgotPasswordIn(ApiModel):
    email: EmailStr | None = None
    login_id: str | None = None

    @model_validator(mode="after")
    def email_or_login_id_required(self) -> "ForgotPasswordIn":
        if not self.email and not self.login_id:
            raise ValueError("Enter either email or login ID")
        return self


class ForgotPasswordOut(ApiModel):
    message: str
    reset_token: str | None = None
    expires_at: datetime | None = None


class ResetPasswordIn(ApiModel):
    reset_token: str
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordIn":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self


class ContactCreate(ApiModel):
    name: str = Field(min_length=2)
    contact_type: ContactType
    email: EmailStr
    mobile: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    profile_image_url: str | None = None
    archived: bool = False


class ContactOut(ContactCreate):
    id: int
    email: str


class ContactUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2)
    contact_type: ContactType | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    profile_image_url: str | None = None
    archived: bool | None = None


class ProductCreate(ApiModel):
    name: str = Field(min_length=2)
    product_type: ProductType
    category: str
    sales_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(ge=0)
    image_url: str | None = None
    archived: bool = False


class ProductOut(ProductCreate):
    id: int


class ProductUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2)
    product_type: ProductType | None = None
    category: str | None = None
    sales_price: Decimal | None = Field(default=None, ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
    image_url: str | None = None
    archived: bool | None = None


class AccountCreate(ApiModel):
    code: str = Field(min_length=2, max_length=20)
    name: str = Field(min_length=2)
    account_type: AccountType
    archived: bool = False


class AccountOut(AccountCreate):
    id: int


class AccountUpdate(ApiModel):
    code: str | None = Field(default=None, min_length=2, max_length=20)
    name: str | None = Field(default=None, min_length=2)
    account_type: AccountType | None = None
    archived: bool | None = None


class JournalCreate(ApiModel):
    name: str = Field(min_length=2)
    journal_type: JournalType
    default_debit_account_id: int | None = None
    default_credit_account_id: int | None = None
    archived: bool = False


class JournalOut(JournalCreate):
    id: int


class JournalUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2)
    journal_type: JournalType | None = None
    default_debit_account_id: int | None = None
    default_credit_account_id: int | None = None
    archived: bool | None = None


class AnalyticAccountCreate(ApiModel):
    name: str = Field(min_length=2)
    code: str = Field(min_length=2, max_length=30)
    description: str | None = None
    archived: bool = False


class AnalyticAccountOut(AnalyticAccountCreate):
    id: int


class AnalyticAccountUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2)
    code: str | None = Field(default=None, min_length=2, max_length=30)
    description: str | None = None
    archived: bool | None = None


class BudgetCreate(ApiModel):
    name: str = Field(min_length=2)
    analytic_account_id: int | None = None
    budget_amount: Decimal = Field(default=0, ge=0)
    spent_amount: Decimal = Field(default=0, ge=0)
    remaining_amount: Decimal | None = Field(default=None, ge=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    archived: bool = False


class BudgetOut(ApiModel):
    id: int
    name: str
    analytic_account_id: int | None
    budget_amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    start_date: datetime | None
    end_date: datetime | None
    archived: bool


class BudgetUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2)
    analytic_account_id: int | None = None
    budget_amount: Decimal | None = Field(default=None, ge=0)
    spent_amount: Decimal | None = Field(default=None, ge=0)
    remaining_amount: Decimal | None = Field(default=None, ge=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    archived: bool | None = None


class PurchaseOrderLineCreate(ApiModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    analytic_account_id: int | None = None
    account_id: int | None = None


class PurchaseOrderCreate(ApiModel):
    vendor_id: int
    order_date: datetime | None = None
    notes: str | None = None
    lines: list[PurchaseOrderLineCreate] = Field(min_length=1)


class PurchaseOrderLineOut(ApiModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    analytic_account_id: int | None = None
    account_id: int | None = None


class PurchaseOrderOut(ApiModel):
    id: int
    po_number: str | None = None
    vendor_id: int
    order_date: datetime
    status: PurchaseStatus
    total_amount: Decimal
    notes: str | None
    lines: list[PurchaseOrderLineOut]


class VendorBillLineOut(ApiModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    analytic_account_id: int | None = None
    account_id: int | None = None


class VendorBillDatesIn(ApiModel):
    bill_reference: str | None = None
    invoice_date: datetime | None = None
    bill_date: datetime | None = None
    due_date: datetime | None = None

    @model_validator(mode="after")
    def due_date_cannot_precede_invoice_date(self) -> "VendorBillDatesIn":
        effective_date = self.invoice_date or self.bill_date
        if effective_date and self.due_date and self.due_date < effective_date:
            raise ValueError("Due date cannot be before invoice date")
        return self


class VendorBillOut(ApiModel):
    id: int
    bill_number: str | None = None
    bill_reference: str | None = None
    purchase_order_id: int
    vendor_id: int
    bill_date: datetime
    invoice_date: datetime
    due_date: datetime | None
    status: BillStatus
    total_amount: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    paid_by_cash: Decimal
    paid_by_bank: Decimal
    journal_entry_id: int | None = None
    lines: list[VendorBillLineOut]
    payments: list[PaymentOut] = []


class PaymentCreate(ApiModel):
    method: PaymentMethod
    amount: Decimal | None = Field(default=None, ge=0)
    reference: str | None = None
    note: str | None = None


class PaymentRequest(ApiModel):
    payment_date: datetime | None = None
    payment_type: PaymentType
    partner_id: int
    method: PaymentMethod
    amount: Decimal = Field(gt=0)
    reference: str | None = None
    note: str | None = None
    vendor_bill_id: int | None = None
    customer_invoice_id: int | None = None


class PaymentOut(ApiModel):
    id: int
    payment_number: str | None = None
    payment_date: datetime
    payment_type: PaymentType
    partner_id: int | None
    method: PaymentMethod
    amount: Decimal
    reference: str | None
    note: str | None = None
    status: PaymentStatus
    vendor_bill_id: int | None
    customer_invoice_id: int | None
    journal_entry_id: int | None = None


class PaymentUpdate(ApiModel):
    payment_date: datetime | None = None
    payment_type: PaymentType | None = None
    partner_id: int | None = None
    method: PaymentMethod | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    reference: str | None = None
    note: str | None = None
    vendor_bill_id: int | None = None
    customer_invoice_id: int | None = None


class SalesOrderLineCreate(ApiModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    analytic_account_id: int | None = None
    account_id: int | None = None


class SalesOrderCreate(ApiModel):
    customer_id: int
    order_date: datetime | None = None
    notes: str | None = None
    lines: list[SalesOrderLineCreate] = Field(min_length=1)


class SalesOrderLineOut(ApiModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    analytic_account_id: int | None = None
    account_id: int | None = None


class SalesOrderOut(ApiModel):
    id: int
    so_number: str | None = None
    customer_id: int
    order_date: datetime
    status: SalesStatus
    total_amount: Decimal
    notes: str | None
    lines: list[SalesOrderLineOut]


class CustomerInvoiceLineOut(ApiModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    analytic_account_id: int | None = None
    account_id: int | None = None


class CustomerInvoiceOut(ApiModel):
    id: int
    invoice_number: str | None = None
    sales_order_id: int
    customer_id: int
    invoice_date: datetime
    due_date: datetime | None = None
    status: InvoiceStatus
    total_amount: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    paid_by_cash: Decimal
    paid_by_bank: Decimal
    journal_entry_id: int | None = None
    lines: list[CustomerInvoiceLineOut]
    payments: list[PaymentOut] = []


class CustomerPaymentOut(ApiModel):
    id: int
    customer_invoice_id: int
    amount: Decimal
    method: PaymentMethod
    reference: str | None


class PaymentGatewayOrderOut(ApiModel):
    id: int
    customer_invoice_id: int
    provider: str
    provider_order_id: str
    amount: Decimal
    currency: str
    status: str
    receipt: str
    key_id: str | None = None


class RazorpayVerifyIn(ApiModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RazorpayVerifyOut(ApiModel):
    verified: bool
    invoice: CustomerInvoiceOut
    payment: CustomerPaymentOut | None = None
    gateway_order: PaymentGatewayOrderOut


class JournalEntryLineOut(ApiModel):
    id: int
    account_id: int
    partner_id: int | None
    debit: Decimal
    credit: Decimal


class JournalEntryOut(ApiModel):
    id: int
    journal_id: int
    reference: str
    entry_date: datetime
    source_type: str | None = None
    source_id: int | None = None
    status: str
    lines: list[JournalEntryLineOut]


class TrialBalanceLineOut(ApiModel):
    account_id: int
    code: str
    name: str
    account_type: AccountType
    debit: Decimal
    credit: Decimal
    balance: Decimal


class ProfitLossOut(ApiModel):
    income: Decimal
    expense: Decimal
    net_profit: Decimal


class BalanceSheetOut(ApiModel):
    assets: Decimal
    liabilities: Decimal
    capital: Decimal
    net_profit: Decimal
    difference: Decimal


class BudgetReportOut(ApiModel):
    target_income: Decimal
    actual_income: Decimal
    income_variance: Decimal
    budgeted_expense: Decimal
    actual_expense: Decimal
    expense_variance: Decimal
    net_profit: Decimal
