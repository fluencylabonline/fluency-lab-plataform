---
name: abacatepay-integration
description: Complete guide and best practices for integrating Abacatepay (Payments, Subscriptions, Webhooks)
metadata:
  tags: abacatepay, payments, pix, subscriptions, webhooks, checkout
---

## When to use

Use this skill whenever you are integrating Abacatepay into an application (now only available to TS) to access domain-specific knowledge, code examples, and best practices.

## How to use

Read individual rule files for detailed explanations and code examples:

- [rules/ts/checkout.md](rules/ts/checkout.md) / [rules/go/checkout.md](rules/go/checkout.md) - Creating one-time payment checkouts (Pix/Card). [Docs](https://docs.abacatepay.com/payment)
- [rules/ts/customers.md](rules/ts/customers.md) / [rules/go/customers.md](rules/go/customers.md) - Managing customers (Create, List, Get, Delete). [Docs](https://docs.abacatepay.com/client)
- [rules/ts/subscriptions.md](rules/ts/subscriptions.md) / [rules/go/subscriptions.md](rules/go/subscriptions.md) - Handling recurring billing, products, and plans.
- [rules/ts/coupons.md](rules/ts/coupons.md) / [rules/go/coupons.md](rules/go/coupons.md) - Managing discounts and coupons. [Docs](https://docs.abacatepay.com/coupon)
- [rules/ts/webhooks.md](rules/ts/webhooks.md) / [rules/go/webhooks.md](rules/go/webhooks.md) - Securely handling events with HMAC verification. [Docs](https://docs.abacatepay.com/webhooks)
- [rules/ts/payouts.md](rules/ts/payouts.md) / [rules/go/payouts.md](rules/go/payouts.md) - Automating withdrawals and payouts. [Docs](https://docs.abacatepay.com/withdraw)
- [rules/ts/transparents.md](rules/ts/transparents.md) / [rules/go/transparents.md](rules/go/transparents.md) - Transparent Checkout integration. [Docs](https://docs.abacatepay.com/pix-qrcode)
- [rules/ts/mrr.md](rules/ts/mrr.md) / [rules/go/mrr.md](rules/go/mrr.md) - Accessing Public MRR and revenue data. [Docs](https://docs.abacatepay.com/trustMRR)
- [rules/ts/products.md](rules/ts/products.md) / [rules/go/products.md](rules/go/products.md) - Managing catalog products via CRUD operations. [Docs](https://docs.abacatepay.com/products)
- [rules/go/security.md](rules/go/security.md) - Best practices for secure integrations and fraud prevention.

Use development tools for enhanced integration experience:
- [tools/auth.md](tools/auth.md) - API key management and authentication guide. [Docs](https://docs.abacatepay.com/authentication)
- [tools/cli.md](tools/cli.md) - Official CLI for terminal-based development, testing, and automation. [Docs](https://docs.abacatepay.com/cli)
- [tools/devmode.md](tools/devmode.md) - Testing environment setup and usage. [Docs](https://docs.abacatepay.com/devmode)
- [tools/ecosystem.md](tools/ecosystem.md) - Open source ecosystem, including official and community projects. [Docs](https://docs.abacatepay.com/ecosystem)
- [tools/items.md](tools/items.md) - Managing subscription items and line items. [Docs](https://docs.abacatepay.com/items)
- [tools/nocode.md](tools/nocode.md) - No-code integration options and platforms. [Docs](https://docs.abacatepay.com/nocode)
- [tools/production.md](tools/production.md) - Best practices for production deployment. [Docs](https://docs.abacatepay.com/production)
- [tools/rest.md](tools/rest.md) - Lightweight REST client for typed API requests. [Docs](https://docs.abacatepay.com/ecosystem/rest)
- [tools/sdks/nodejs.md](tools/sdks/nodejs.md) - Node.js SDK for quick payment integration. [Docs](https://docs.abacatepay.com/sdks/nodejs)
- [tools/start.md](tools/start.md) - Quickstart guide for first API requests. [Docs](https://docs.abacatepay.com/start/quickstart)
- [tools/store.md](tools/store.md) - Retrieving and managing store information. [Docs](https://docs.abacatepay.com/store)
- [tools/theme.md](tools/theme.md) - Official green-first theme for VS Code, IntelliJ, and Neovim. [Docs](https://docs.abacatepay.com/ecosystem/theme)
- [tools/types.md](tools/types.md) - Official TypeScript typings and helpers for API integration. [Docs](https://docs.abacatepay.com/ecosystem/types)
- [tools/zod.md](tools/zod.md) - Zod schemas for runtime validation and OpenAPI generation. [Docs](https://docs.abacatepay.com/ecosystem/zod)
- [tools/sdks/nodejs.md](tools/sdks/nodejs.md) - Node.js SDK for quick payment integration. [Docs](https://docs.abacatepay.com/sdks/nodejs)
- [tools/sdks/go.md](tools/sdks/go.md) - Go HTTP integration for payment API. [Docs](https://docs.abacatepay.com)
- [tools/auth.md](tools/auth.md) - API key management and authentication guide. [Docs](https://docs.abacatepay.com/authentication)
- [tools/devmode.md](tools/devmode.md) - Testing environment setup and usage. [Docs](https://docs.abacatepay.com/devmode)
- [tools/production.md](tools/production.md) - Best practices for production deployment. [Docs](https://docs.abacatepay.com/production)

## File Index

Complete list of all files with objective summaries:

**Rules > TS**
- [rules/ts/checkout.md](rules/ts/checkout.md) - Guide for creating one-time checkouts via AbacatePay API, with Pix, card, validation and error handling.
- [rules/ts/coupons.md](rules/ts/coupons.md) - Managing discount coupons, creation, listing, toggle and validation.
- [rules/ts/customers.md](rules/ts/customers.md) - Instructions for managing customers via CRUD, with required fields, metadata and secure integration.
- [rules/ts/mrr.md](rules/ts/mrr.md) - Accessing public MRR and revenue data, business metrics and visualization.
- [rules/ts/payouts.md](rules/ts/payouts.md) - Automating withdrawals and payouts, creation, query and transaction status.
- [rules/ts/products.md](rules/ts/products.md) - Instructions for managing catalog products via CRUD, with cache and integration in checkouts.
- [rules/ts/security.md](rules/ts/security.md) - Best practices for secure integrations, data protection and fraud prevention.
- [rules/ts/subscriptions.md](rules/ts/subscriptions.md) - Guide for recurring subscriptions, including creation, items, plans and cancellation.
- [rules/ts/transparents.md](rules/ts/transparents.md) - Transparent checkout integration, payment simulation and status verification.
- [rules/ts/webhooks.md](rules/ts/webhooks.md) - Webhook setup and verification via dashboard, with HMAC examples and secure processing.

**Examples > TS**
- [examples/ts/checkout-react.tsx](examples/ts/checkout-react.tsx) - React component for checkout integration, with hooks and state.
- [examples/ts/checkout.ts](examples/ts/checkout.ts) - TS implementation for creating checkouts, with Pix and card examples using SDK.
- [examples/ts/coupons.ts](examples/ts/coupons.ts) - Coupon examples in TS, creation and application.
- [examples/ts/customers.ts](examples/ts/customers.ts) - TS examples for customer CRUD, with HTTP requests and data handling.
- [examples/ts/mrr.ts](examples/ts/mrr.ts) - MRR access in TS, with requests for metrics.
- [examples/ts/payouts.ts](examples/ts/payouts.ts) - TS implementation for payouts, creation and query.
- [examples/ts/products.ts](examples/ts/products.ts) - Product CRUD in TS, with cache and SDK.
- [examples/ts/remotion-mrr.tsx](examples/ts/remotion-mrr.tsx) - MRR visualization with Remotion, animations and charts.
- [examples/ts/store.ts](examples/ts/store.ts) - Examples for accessing store data via API.
- [examples/ts/subscriptions.ts](examples/ts/subscriptions.ts) - TS code for managing subscriptions, including creation and listing.
- [examples/ts/transparents.ts](examples/ts/transparents.ts) - Transparent checkout examples in TS.
- [examples/ts/webhook.ts](examples/ts/webhook.ts) - Webhook verification in TS, with HMAC and event processing.

**Tests > TS**
- [tests/ts/checkout.test.ts](tests/ts/checkout.test.ts) - Jest tests for checkout functions, success and error cases.
- [tests/ts/webhook.test.ts](tests/ts/webhook.test.ts) - Tests for webhook validation, HMAC and processing.

**Utils**
- [utils/faq.md](utils/faq.md) - Frequently asked questions about AbacatePay integration, troubleshooting and tips. [Docs](https://docs.abacatepay.com/faq)
- [utils/glossary.md](utils/glossary.md) - Glossary of technical terms and concepts. [Docs](https://docs.abacatepay.com/glossario)

**Tools**
- [tools/auth.md](tools/auth.md) - API key management and authentication guide. [Docs](https://docs.abacatepay.com/authentication)
- [tools/cli.md](tools/cli.md) - Official CLI tool for development, testing, and local automations. [Docs](https://docs.abacatepay.com/cli)
- [tools/devmode.md](tools/devmode.md) - Testing environment setup and usage. [Docs](https://docs.abacatepay.com/devmode)
- [tools/ecosystem.md](tools/ecosystem.md) - Overview of open source ecosystem with official and community projects. [Docs](https://docs.abacatepay.com/ecosystem)
- [tools/items.md](tools/items.md) - Managing subscription items and line items. [Docs](https://docs.abacatepay.com/items)
- [tools/nocode.md](tools/nocode.md) - No-code integration options and platforms. [Docs](https://docs.abacatepay.com/nocode)
- [tools/production.md](tools/production.md) - Best practices for production deployment. [Docs](https://docs.abacatepay.com/production)
- [tools/rest.md](tools/rest.md) - Lightweight REST client for typed API requests with retries and timeouts. [Docs](https://docs.abacatepay.com/ecosystem/rest)
- [tools/sdks/go.md](tools/sdks/go.md) - Go HTTP integration for payment API. [Docs](https://docs.abacatepay.com)
- [tools/sdks/nodejs.md](tools/sdks/nodejs.md) - Node.js SDK for quick payment integration. [Docs](https://docs.abacatepay.com/sdks/nodejs)
- [tools/start.md](tools/start.md) - Quickstart guide for first API requests. [Docs](https://docs.abacatepay.com/start/quickstart)
- [tools/store.md](tools/store.md) - Retrieving and managing store information. [Docs](https://docs.abacatepay.com/store)
- [tools/theme.md](tools/theme.md) - Official green-first theme for VS Code, IntelliJ, and Neovim editors. [Docs](https://docs.abacatepay.com/ecosystem/theme)
- [tools/types.md](tools/types.md) - TypeScript typings and helpers for safe API integrations. [Docs](https://docs.abacatepay.com/ecosystem/types)
- [tools/zod.md](tools/zod.md) - Zod schemas for runtime validation, contracts, and OpenAPI generation. [Docs](https://docs.abacatepay.com/ecosystem/zod)

**Root**
- [README.md](README.md) - Skill overview, installation and structure.
- [SKILL.md](SKILL.md) - Metadata and usage guide (this file).

## Visual Documentation

### Checkout Flow Diagram
Use Mermaid or similar tools to visualize the checkout process:

```
graph TD
    A[User Initiates Checkout] --> B[Create Checkout Request]
    B --> C[Abacatepay API Processes]
    C --> D[Return Checkout URL]
    D --> E[User Completes Payment]
    E --> F[Webhook Notification]
    F --> G[Application Handles Event]
```

### Webhook Flow Diagram
```
graph TD
    A[Event Occurs in Abacatepay] --> B[Webhook Sent to Endpoint]
    B --> C[Verify Signature]
    C --> D{Valid?}
    D -->|Yes| E[Process Event]
    D -->|No| F[Reject Request]
    E --> G[Respond with 200]
    F --> H[Respond with 401]
```

Suggested tools: Mermaid (integrates with Markdown), Draw.io, or Lucidchart for creating diagrams.
