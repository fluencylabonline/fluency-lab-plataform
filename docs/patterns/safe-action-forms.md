# Pattern: Safe Actions + React Hook Form

In FluencyLab, we use `next-safe-action` for all server-side mutations. This guide explains how to handle action results in the client without TypeScript errors.

## ⚠️ Mandatory Rules

1.  **Always use `notify.promise`**: Native `confirm()` or manual `try/catch` with `notify.success/error` is discouraged for server mutations.
2.  **Explicit Typing is REQUIRED**: You MUST cast the return of the action to include `error?: string` so the client can read it.
3.  **Throw on `success: false`**: Inside `notify.promise`, you MUST check `result?.data?.success` and throw an error if it's false.

## The `SafeActionResult` Structure

When you call a server action, it returns a `SafeActionResult` object. Unlike a simple return value, this object is wrapped by the library to include validation results and server errors.

**❌ INCORRECT (Common TS Error):**
```tsx
const result = await myAction(data);
if (result.success) { // Property 'success' does not exist
    // ...
}
```

**✅ CORRECT:**
The actual data returned by your action function (the `.action()` block) lives inside the `data` property.

```tsx
const result = await myAction(data);
if (result?.data?.success) {
    // Access your return data here
    console.log(result.data.info);
} else {
    // Handle error
    notify.error(result?.data?.error || "Ocorreu um erro");
}
```

## Integration with `notify.promise` (Required Pattern)

For better UX, prefer using `notify.promise` when an action takes time. It automatically handles the loading state and allows you to "unwrap" the result in the success callback.

```tsx
const onSubmit = async (data: FormValues) => {
    const promise = myAction(data);

    notify.promise(promise, {
        loading: "Salvando...",
        success: (result) => {
            // result is the SafeActionResult
            // MANDATORY: Check the business success flag
            if (result?.data?.success) {
                return "Sucesso!";
            }
            
            // MANDATORY: Throw to trigger the 'error' toast
            // If you don't throw, notify.promise will show a success toast even if the logic failed
            throw new Error(result?.data?.error || "Erro desconhecido");
        },
        error: (err: any) => {
            // TIP: 'err' is unknown by default, casting to 'any' is necessary for err.message
            return err.message || "Falha na requisição";
        }
    });
};
```

## Why this happens?

`next-safe-action` returns an object with this shape:
- `data`: The value you returned from the `.action()` function.
- `serverError`: Error thrown during execution (caught by `safe-action.ts`).
- `validationErrors`: Errors from Zod parsing.

In FluencyLab, our actions follow a standard return of `{ success: boolean, error?: string, ... }`. 

### ⚠️ Important: Explicit Typing

If your action only returns `{ success: true }` in the success case, TypeScript will infer the type of `data` as exactly `{ success: boolean }` and will complain when you try to access `result.data.error` in the client.

To avoid this, **always cast the return value** or include the field explicitly:

```tsx
// modules/domain/domain.actions.ts
export const myAction = protectedAction
  .action(async () => {
    // ...
    // Cast is mandatory for the client to see the 'error' field
    return { success: true } as { success: boolean; error?: string };
  });
```

This ensures that the client can safely check `result?.data?.error` without TypeScript errors.

## Standard Form Components

To maintain consistency and accessibility, always use the project's custom components instead of native elements. These components are already integrated with the design system and handle mobile/PWA states automatically.

| Component | Usage | Integration |
|-----------|-------|-------------|
| `Field` | Wrapper for all inputs. Handles Labels, Asterisks (`required`), and Error Messages. | Native |
| `Input` | Single-line text inputs. | `register` |
| `Textarea` | Multi-line text inputs with auto-resize support. | `register` |
| `Select` | Adaptive dropdown (Vault on mobile). | `Controller` |
| `Checkbox` | Standard toggle for boolean values. | `Controller` |
| `DropdownMenu` | Complex selection or context menus. | Native |

### 💡 Tip: Using `Field`
The `Field` component is the most important one for UX. It centralizes the label and error display:

```tsx
<Field label="Nome Completo" required error={errors.name?.message}>
  <Input {...register("name")} />
</Field>
```

---

## Summary Table

| Goal | Path |
|------|------|
| Check if logic succeeded | `result?.data?.success` |
| Get business error message | `result?.data?.error` |
| Get server-level error | `result?.serverError` |
| Get Zod validation errors | `result?.validationErrors` |
