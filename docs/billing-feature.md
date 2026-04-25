# 💸 Billing Module Documentation

This module handles all financial operations for the FluencyLab platform, including recurring subscriptions, PIX payments, automated reminders, and integrations with **AbacatePay V2**.

## 🏗️ Architecture

Following the project's **Sanduíche Pattern** and **Pragmatic DDD**:

- **Schema (`billing.schema.ts`)**: Defines database tables for Plans, Subscriptions, and Installments using Drizzle ORM.
- **Repository (`billing.repository.ts`)**: Pure database queries.
- **Service (`billing.service.ts`)**: Core business logic, RBAC, and AbacatePay orchestration.
- **Actions (`billing.actions.ts`)**: Server-side entry points for the client, including Zod validation and session checks.

---

## 📋 Core Entities

### 1. Plans (`plans`)
Defined by name, price (in cents), duration in months, language, and classes per week. Plans are synced with AbacatePay as "Products".
- **New Fields**: `language` (text), `classesPerWeek` (integer).

### 2. Subscriptions (`subscriptions`)
Links a Student to a Plan. It tracks the status (`active`, `cancelled`, etc.) and the chosen `dueDay` (1, 5, 10, or 15).

### 3. Installments (`installments`)
Automatically generated when a subscription is created. Each installment represents a monthly payment.

---

## 🔄 Key Workflows

### 1. Creating a Plan
Managed by Admins via `createPlanAction`.
- **Process**:
  1. Create a Product in AbacatePay.
  2. Store the plan details and `abacatePayProductId` in the local DB.

### 2. Creating a Subscription
Managed by Admins via `createSubscriptionAction`.
- **Process**:
  1. Sync student data with AbacatePay as a "Customer".
  2. Create the subscription record.
  3. Generate N "pending" installments (where N is the plan duration).

### 3. Automated Charge Generation (Transparent PIX)
Triggered by a Cron job calling `billingService.generatePendingInvoices()`.
- **Timing**: Generates the PIX charge **7 days before** the installment's `dueDate`.
- **Logic**: 
  - Verifies if the student has a `taxId` and `cellphone` (required for PIX).
  - Calls AbacatePay Transparent PIX API.
  - Updates the installment with the PIX code (`brCode`) and Base64 image.

### 4. Student Dashboard & Payment
Students access their pending payments via `getActivePaymentAction`.
- **Display**: Shows the PIX Copy-Paste code and QR Code directly in the UI.
- **Link**: If a checkout URL is available, it provides a link to the AbacatePay hosted page.

### 5. Webhook Handling
The system listens for `billing.paid` events from AbacatePay.
- **Location**: `/app/api/webhooks/abacatepay/route.ts` (calls `billingService.processWebhook`).
- **Signature Verification**: Uses `ABACATEPAY_WEBHOOK_SECRET` for HMAC-SHA256 verification.
- **Actions on Payment**:
  - Updates installment status to `paid`.
  - Sends a confirmation email to the student.
  - Sends an In-App and Push notification.
  - If the payment is a **Cancellation Fee**, it finalizes the contract cancellation.

### 6. Cancellation Policy
Handled via `cancelSubscriptionAction`.
- **Rule**: If the student cancels before the last month, a **50% fee** of one monthly payment is applied.
- **Process**:
  1. Calculate fee.
  2. Generate a Transparent PIX charge for the fee.
  3. Set subscription status to `cancelled`.
  4. Contract is only fully terminated after the fee is paid (processed via webhook).

### 7. Automated Reminders & Overdue Logic
Triggered by a Cron job calling `billingService.processBillingNotifications()`.
- **2 Days Before**: Email + Push + WhatsApp reminder.
- **Day of Due Date**: Email + Push reminder.
- **1 Day After**: Marks status as `overdue`. Email + Push + WhatsApp alert.

---

## 🛠️ Usage Guide (For Developers)

### Creating a Plan
```typescript
import { billingService } from "@/modules/billing/billing.service";

await billingService.createPlan({
  name: "Plano Premium Inglês",
  price: 29700, // R$ 297,00
  durationMonths: 12,
  language: "Inglês",
  classesPerWeek: 2,
  description: "Acesso total à plataforma"
});
```

### Updating a Plan
```typescript
await billingService.updatePlan(planId, {
  price: 33000,
  classesPerWeek: 3
});
```

### Creating a Subscription
```typescript
await billingService.createSubscription(studentId, planId, 10); // Vencimento dia 10
```

### Checking Active Payments (Student Side)
```typescript
const payment = await billingService.getActivePayment(studentId);
if (payment) {
  console.log("PIX Copy-Paste:", payment.pixPayload);
}
```

---

## 🛠️ Technical Integration (AbacatePay V2)

The platform uses the `@abacatepay/sdk` for all communications.

### Transparent PIX Implementation
Instead of redirecting users to an external checkout, we fetch the PIX data directly:
```typescript
const pix = await abacate.pix.create({
  amount: Math.round(amount * 100),
  customer: { name, email, taxId, cellphone },
  metadata: { installmentId, subscriptionId }
});
// result contains .brCode and .brCodeBase64
```

### Security & RBAC
- **Admin**: Can create plans and manage any subscription.
- **Student**: Can only view and cancel their own subscriptions.
- **Service Layer**: All ownership checks and business rules are enforced in `billing.service.ts`.

---

## 📡 Webhook Configuration
Ensure your AbacatePay dashboard is configured to send events to:
`https://your-domain.com/api/webhooks/abacatepay`

Supported Events:
- `billing.paid`: Updates status and triggers notifications.
