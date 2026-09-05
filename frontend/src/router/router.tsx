import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireRole } from './RequireRole'
import { AdminShell } from '@/components/layout/AdminShell'
import { PortalShell } from '@/components/layout/PortalShell'

import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

import { ContactListPage } from '@/pages/contacts/ContactListPage'
import { ContactDetailPage } from '@/pages/contacts/ContactDetailPage'

import { ProductListPage } from '@/pages/products/ProductListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'

import { ChartOfAccountsPage } from '@/pages/accounting/ChartOfAccountsPage'
import { AccountFormPage } from '@/pages/accounting/AccountFormPage'
import { JournalListPage } from '@/pages/accounting/JournalListPage'
import { JournalFormPage } from '@/pages/accounting/JournalFormPage'
import { JournalEntryListPage } from '@/pages/accounting/JournalEntryListPage'

import { PurchaseOrderListPage } from '@/pages/purchases/PurchaseOrderListPage'
import { PurchaseOrderFormPage } from '@/pages/purchases/PurchaseOrderFormPage'
import { VendorBillListPage } from '@/pages/purchases/VendorBillListPage'
import { VendorBillDetailPage } from '@/pages/purchases/VendorBillDetailPage'

import { SalesOrderListPage } from '@/pages/sales/SalesOrderListPage'
import { SalesOrderFormPage } from '@/pages/sales/SalesOrderFormPage'
import { CustomerInvoiceListPage } from '@/pages/sales/CustomerInvoiceListPage'
import { CustomerInvoiceDetailPage } from '@/pages/sales/CustomerInvoiceDetailPage'

import { PaymentListPage } from '@/pages/payments/PaymentListPage'
import { PaymentFormPage } from '@/pages/payments/PaymentFormPage'

import { AnalyticAccountListPage } from '@/pages/budgets/AnalyticAccountListPage'
import { AnalyticAccountFormPage } from '@/pages/budgets/AnalyticAccountFormPage'
import { BudgetListPage } from '@/pages/budgets/BudgetListPage'
import { BudgetFormPage } from '@/pages/budgets/BudgetFormPage'

import { ReportsHomePage } from '@/pages/reports/ReportsHomePage'
import { TrialBalancePage } from '@/pages/reports/TrialBalancePage'
import { BalanceSheetPage } from '@/pages/reports/BalanceSheetPage'
import { ProfitLossPage } from '@/pages/reports/ProfitLossPage'
import { BudgetReportPage } from '@/pages/reports/BudgetReportPage'

import { PortalInvoiceListPage } from '@/pages/portal/PortalInvoiceListPage'
import { PortalInvoiceDetailPage } from '@/pages/portal/PortalInvoiceDetailPage'
import { PortalPaymentHistoryPage } from '@/pages/portal/PortalPaymentHistoryPage'

const STAFF = ['admin', 'invoicing_user'] as const

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { index: true, element: <Navigate to="/dashboard" replace /> },

  {
    element: <RequireRole allow={[...STAFF]} />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },

          { path: 'contacts', element: <ContactListPage /> },
          { path: 'contacts/:id', element: <ContactDetailPage /> },

          { path: 'products', element: <ProductListPage /> },
          { path: 'products/:id', element: <ProductDetailPage /> },

          { path: 'accounting/chart-of-accounts', element: <ChartOfAccountsPage /> },
          { path: 'accounting/chart-of-accounts/new', element: <AccountFormPage /> },
          { path: 'accounting/journal-entries', element: <JournalEntryListPage /> },

          { path: 'purchases/orders', element: <PurchaseOrderListPage /> },
          { path: 'purchases/orders/new', element: <PurchaseOrderFormPage /> },
          { path: 'purchases/orders/:id', element: <PurchaseOrderFormPage /> },
          { path: 'purchases/bills', element: <VendorBillListPage /> },
          { path: 'purchases/bills/:id', element: <VendorBillDetailPage /> },

          { path: 'sales/orders', element: <SalesOrderListPage /> },
          { path: 'sales/orders/new', element: <SalesOrderFormPage /> },
          { path: 'sales/orders/:id', element: <SalesOrderFormPage /> },
          { path: 'sales/invoices', element: <CustomerInvoiceListPage /> },
          { path: 'sales/invoices/:id', element: <CustomerInvoiceDetailPage /> },

          { path: 'payments', element: <PaymentListPage /> },
          { path: 'payments/new', element: <PaymentFormPage /> },

          { path: 'budgets/analytic-accounts', element: <AnalyticAccountListPage /> },
          { path: 'budgets/analytic-accounts/new', element: <AnalyticAccountFormPage /> },
          { path: 'budgets/analytic-accounts/:id', element: <AnalyticAccountFormPage /> },
          { path: 'budgets', element: <BudgetListPage /> },
          { path: 'budgets/new', element: <BudgetFormPage /> },
          { path: 'budgets/:id', element: <BudgetFormPage /> },

          { path: 'reports', element: <ReportsHomePage /> },
          { path: 'reports/trial-balance', element: <TrialBalancePage /> },
          { path: 'reports/balance-sheet', element: <BalanceSheetPage /> },
          { path: 'reports/profit-loss', element: <ProfitLossPage /> },
          { path: 'reports/budget', element: <BudgetReportPage /> },
        ],
      },
      {
        element: <RequireRole allow={['admin']} />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: 'accounting/journals', element: <JournalListPage /> },
              { path: 'accounting/journals/new', element: <JournalFormPage /> },
            ],
          },
        ],
      },
    ],
  },

  {
    element: <RequireRole allow={['contact']} />,
    children: [
      {
        element: <PortalShell />,
        children: [
          { path: 'portal', element: <Navigate to="/portal/invoices" replace /> },
          { path: 'portal/invoices', element: <PortalInvoiceListPage /> },
          { path: 'portal/invoices/:id', element: <PortalInvoiceDetailPage /> },
          { path: 'portal/payments', element: <PortalPaymentHistoryPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
], {
  future: {
    v7_relativeSplatPath: true,
  },
})
