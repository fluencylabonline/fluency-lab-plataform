# Pattern: Safe Actions + React Hook Form

In FluencyLab, we use `next-safe-action` for all server-side mutations. This guide explains how to handle action results in the client without TypeScript errors.

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

## Integration with `notify.promise`

For better UX, prefer using `notify.promise` when an action takes time. It automatically handles the loading state and allows you to "unwrap" the result in the success callback.

```tsx
const onSubmit = async (data: FormValues) => {
    const promise = myAction(data);

    notify.promise(promise, {
        loading: "Salvando...",
        success: (result) => {
            // result is the SafeActionResult
            if (result?.data?.success) {
                return "Sucesso!";
            }
            // If the action returned { success: false }, throw to trigger the 'error' toast
            throw new Error(result?.data?.error || "Erro desconhecido");
        },
        error: (err) => {
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
    return { success: true } as { success: boolean; error?: string };
  });
```

This ensures that the client can safely check `result?.data?.error` without TypeScript errors.

## Summary Table

| Goal | Path |
|------|------|
| Check if logic succeeded | `result?.data?.success` |
| Get business error message | `result?.data?.error` |
| Get server-level error | `result?.serverError` |
| Get Zod validation errors | `result?.validationErrors` |
