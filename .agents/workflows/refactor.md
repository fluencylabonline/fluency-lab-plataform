---
description: Workflow para refatorar componentes vindos de outros códigos
---

# Workflow: Component Refactor

Use this workflow to refactor any existing or "dirty" component into FluencyLab standards.

## 1. Analyze Rendering Mode (RSC vs Client)
- **Rule**: `page.tsx` and `layout.tsx` must be RSC.
- **Action**: Check if `"use client"` exists. Move logic to a child component in `_components/` if needed.
- **Pattern**: Use the "Sandwich" pattern:
    - **Top (Server)**: Fetch user session, data, and DB records in RSC.
    - **Middle (Props)**: Pass data down to Client Components.
    - **Bottom (Client)**: Interactive UI, capturing intentions, and calling Server Actions.

## 2. Primitives & Design System
- **Vaults**: Replace all `Dialog`, `Modal`, or `Drawer` with `Vault`.
    - Import from `@/components/ui/vault`.
- **Buttons**: Use `@/components/ui/button`.
- **Notify**: Replace `console.log` or local error states for Auth/Business logic with `notify.error()` or `notify.success()`.
- **Loading**: Ensure all mutations (Server Actions) show a loading state (spinner).
- **Forms & Validation**:
    - **React Hook Form**: Never manage complex form state manually with `useState`. Always use `react-hook-form` for consistency.
    - **Zod**: Always use Zod schemas for form validation and server-side input parsing.
- **Animations Framer Motion**: When applying framer-motion see @lib/animations.ts and try to reuse. If there's nothing useful, create inside animations.ts and use it. 

## 3. Auth & Logic
- **authClient**: Use `@/lib/auth-client` for all client-side auth operations (signIn, signOut).
- **Session**: Don't use `useSession` or similar directly if it's not provided by the project. Prefer passing the `user` prop from RSC using `getCurrentUser()`.
- **Server Actions**: Move complex logic to `modules/[domain]/[domain].actions.ts`.

## 4. Coding Standards & i18n
- **i18n (next-intl)**:
    - **Modern API**: Verify if `next-intl` is updated. Use modern hooks like `useTranslations()`. Avoid deprecated patterns.
    - **Fallbacks**: ALWAYS provide a fallback for every translation call using logical OR (e.g., `t("key") || "fallback"`). This ensures the UI remains functional even if a translation is missing (Rule 9 in AGENTS.md).
    - **Messages Integrity**: Verify that all keys used in `t("key")` are present in `messages/en.json` and `messages/pt.json`. Don't use keys that don't exist in the local message files.
- **Imports**: Always use `@/` alias for root-level imports.
- **Assets**: Use `@/public/...` for images and videos.
- **Naming**: Ensure files follow `modules/` slicing or `components/ui` / `components/layout`.
- **Zod**: Ensure any input parsing uses Zod schemas from `modules/[domain]/[domain].schema.ts`.
- **Comments**: Don't add comments when coding or refactoring. Only if extremely necessary.

## 5. Verification
- Run `npm run lint`.
- Verify mobile responsiveness (Mobile-First approach).
- Check standard Accessibility (A11y) like touch targets and contrast.