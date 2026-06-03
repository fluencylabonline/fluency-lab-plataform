# FluencyLab Platform

FluencyLab is a modern web platform built with Next.js App Router, emphasizing a **"Thin Client, Fat Server"** architecture, Pragmatic Domain-Driven Design (DDD), and top-tier security and UI/UX standards.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database:** [Neon Postgres](https://neon.tech/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication & Storage:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 + [Framer Motion](https://www.framer.com/motion/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) + Radix UI
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) + `next-safe-action`
- **Data Fetching (Client):** [SWR](https://swr.vercel.app/)
- **State Management (UI):** [Zustand](https://zustand-demo.pmnd.rs/)
- **Payments:** [AbacatePay](https://abacatepay.com/)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/) (with Collaboration via Yjs)
- **Video & Chat:** [Stream](https://getstream.io/)
- **Emails:** [Resend](https://resend.com/) + React Email

## 🏗️ Architecture: The "Sandwich" Pattern (Thin Client, Fat Server)

We enforce a strict separation of concerns to ensure security, performance, and maintainability:

1. **Server (Read):** `page.tsx` fetches data via the Service layer (Server Components).
2. **Client (Interact):** UI components in `_components/` render the data and capture user intentions ("use client").
3. **Server (Write):** Client components trigger mutations by calling **Server Actions**.

### Bounded Contexts (Pragmatic DDD)

Business logic is vertically sliced into domains within the `/modules/` directory:

```text
modules/[domain]/
├── [domain].schema.ts      # Drizzle tables + Zod schemas
├── [domain].repository.ts  # Pure DB queries (no business logic)
├── [domain].service.ts     # Business logic & RBAC (Role-Based Access Control)
├── [domain].actions.ts     # Server Actions (Zod validation + Error Masking)
└── [domain].types.ts       # Shared TypeScript types
```

- **Repositories** only talk to the DB.
- **Services** orchestrate Repositories, apply algorithms, and check RBAC.
- **Actions** validate input with Zod, get the user session, and call the Service.
- **Cross-module communication:** A module (e.g., `finance`) must NEVER access the repository of another module (e.g., `user`). It must use the `userService`.

## 🛡️ Security & LGPD Compliance

FluencyLab implements top-tier security standards, keeping user privacy (LGPD/GDPR) and system stability at the core of its architecture:

### 1. Data Isolation & RSC Leakage Prevention (DTOs)
- **RSC Data Filtering:** We strictly prevent raw database entity serialization to React Server Components (RSC) and HTML payloads.
- **Structured DTOs:** We utilize strictly-typed Data Transfer Objects (`SettingsUserDTO`, `AdminUserDTO`) in the server layer. Highly confidential database columns (e.g., `mfaSecret`, TOTP secrets, PIX keys, CPFs/CNPJs, and full addresses) never leave the server boundaries.
- **Dynamic Masking:** Personally Identifiable Information (PII) like phone numbers (`cellphone`) are decrypted on the server and partially masked (e.g., `(11) 9****-1234`) before being rendered by client components.

### 2. Cryptography & Sudo Mode
- **PII Encryption:** Sensitive database fields (such as CPF/CNPJ, PIX keys, and physical addresses) are encrypted in the database using a server-side cipher (`iv:encrypted:tag`).
- **Sudo Mode Protection:** High-risk actions (e.g., account deactivation, data export, or revealing raw encrypted details to administrators) require strict re-authentication (Sudo Session verification) and are limited to dynamic security vaults.

### 3. LGPD & GDPR Compliance Workflows
- **Right to Portability (Export Data):** Users can request a complete, structured export of their personal data. This process is protected under Sudo Mode to prevent identity theft.
- **Right to be Forgotten (Data Purging):**
  1. **Anonymization:** Personal database records are anonymized (severing identity, keeping raw relations for 5 years to comply with local tax/legal requirements).
  2. **Auth Deletion:** Immediate deletion from Firebase Auth to block future logins.
  3. **Storage Cleanup:** All user-uploaded assets (avatars, contract PDFs, certificates, and ID documents) are permanently deleted from Firebase Storage.
  4. **Third-Party Cleanup:** Automated cancellation and customer deletion in external payment systems (AbacatePay).

### 4. Rate Limiting & Abuse Prevention
- **Atomic Operations:** All public-facing and expensive endpoints (e.g., authentication, dynamic searches, invitations, profile updates) are protected by a centralized, atomic rate-limiting helper.
- **Neon Composite Indexing:** Limiting is tracked atomically in Neon serverless database utilizing composite unique indices (`[serviceName, identifier]`) to prevent race conditions and brute-force attacks.

### 5. Error Masking & Input Boundaries
- **Strict Zod Parsing:** Every network input boundary (Server Actions, Webhooks) strictly parses payloads using Zod prior to processing.
- **Masked Internal Errors:** Raw database or code exception details are automatically masked using `next-safe-action` wrappers, returning only sanitized `{ success: false, error: string }` responses to client components.

## 🎨 UI/UX Guidelines

- **Mobile-First:** Fully responsive design built mobile-first.
- **Shimmer Skeletons:** Used for all loading states via `@shimmer-from-structure/react`.
- **Adaptive Components:** Usage of Vaults instead of simple Dialogs for mobile optimization.
- **No Manual Shadows:** Clean, modern design following internal global theme guidelines.
- **Optimistic Updates & Feedback:** Mutations are followed by instant toast notifications (`sonner`) and clear loading states.

## 📱 PWA & Status Bar Optimization

To ensure a seamless, native-like experience on mobile devices and inside the Progressive Web App (PWA), we implement specialized viewport and style synchronization rules:

### 1. Viewport & Zoom Control in Standalone Mode
- **Standard Browsers:** We keep pinch-to-zoom enabled (`userScalable: true`, `maximumScale: 5`) to adhere to Web Content Accessibility Guidelines (WCAG).
- **Standalone PWA Mode:** In [PwaHandler](file:///c:/Users/Mathe/Documents/Projetos/fluency-lab-plataform/components/layout/pwa-handler.tsx), we dynamically intercept the client hydration and page transitions (`pathname` changes). If the app is running in standalone mode (`display-mode: standalone`), we rewrite the `<meta name="viewport">` attributes to block pinch-to-zoom (`user-scalable=no, maximum-scale=1`) so the platform behaves like a native mobile app.

### 2. Status Bar Color Synchronization (Light/Dark Themes)
We ensure the device's status bar background color perfectly matches the app header/background without flashes:
- **Server-Side Render (SSR) Flash Prevention:** In [layout.tsx](file:///c:/Users/Mathe/Documents/Projetos/fluency-lab-plataform/app/[locale]/layout.tsx), the static `viewport` exports a media-query array using `prefers-color-scheme`. This renders native media-query-based meta tags (`#f0f0f0` for light mode, `#02060e` for dark mode), allowing the mobile browser to style the status bar immediately before JavaScript loads.
- **Dynamic Theme Changes & Navigation:** The [ThemeColorUpdater](file:///c:/Users/Mathe/Documents/Projetos/fluency-lab-plataform/components/layout/theme-color-updater.tsx) client component reactively updates the status bar color when the user toggles the theme (monitored via `next-themes`' `resolvedTheme`) or navigates between pages (`pathname`).
- **No-Crash Safe DOM Operations:** Mobile browsers (such as iOS Safari) do not support modern formats like OKLCH in `<meta name="theme-color">`. Therefore, we map themes to safe **HEX** colors. Additionally, we update the existing elements' attributes (`setAttribute` / `removeAttribute`) instead of removing and recreating DOM nodes (`.remove()`), avoiding crashes in React's virtual DOM unmounting cycle (`commitDeletion`).
