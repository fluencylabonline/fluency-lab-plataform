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

## 🛡️ Security & Error Handling

- **Error Masking:** Raw database errors are NEVER sent to the client. Server Actions return sanitized objects like `{ success: false, error: "Friendly message" }` using `safe-action`.
- **Firebase Security Rules:** All storage access is governed by strict `storage.rules`.
- **Zod Validation:** Every input boundary (Actions, APIs) is strictly typed and validated.

## 🎨 UI/UX Guidelines

- **Mobile-First:** Fully responsive design built mobile-first.
- **Shimmer Skeletons:** Used for all loading states via `@shimmer-from-structure/react`.
- **Adaptive Components:** Usage of Vaults instead of simple Dialogs for mobile optimization.
- **No Manual Shadows:** Clean, modern design following internal global theme guidelines.
- **Optimistic Updates & Feedback:** Mutations are followed by instant toast notifications (`sonner`) and clear loading states.
