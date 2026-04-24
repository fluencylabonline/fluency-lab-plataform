# 🏗️ Layout Pattern: Fixed Header + Scrolling SubHeader (V2)

This guide explains the most elegant way to implement the **Fixed Top Bar + Scrolling Sub-Header** pattern in FluencyLab using a single `Header` component.

### 1. Main Layout Shell (`hub/layout.tsx`)
The layout must remain a non-scrolling shell.
```tsx
<div className="content-layout w-full h-full overflow-hidden">
    {children}
</div>
```

### 1. Page Component Structure (`PageClient.tsx`)
The page root should be the scrollable container, and the `Header` should use the `contents` class.

```tsx
export function PageClient({ user, data }) {
    return (
        /* The root is the scrollable area */
        <main className="h-full overflow-y-auto custom-scrollbar">
            <Header
                title="Page Title"
                subtitle="This will scroll away..."
                user={user}
                className="contents" // Critical: bypasses the wrapper div
            />

            <div className="container">
                {/* Content scrolls normally */}
            </div>
        </main>
    );
}
```

### 2. Why this works?
1. **`display: contents`**: This utility makes the `Header` component's root `div` "invisible" to the layout engine. Its children (`<header>` and `<div className="sub-header">`) behave as direct children of the `<main>` scrollable container.
2. **Sticky Context**: Since the internal `<header>` is now a direct child of the scrollable `<main>`, its `sticky top-0` property works across the entire scrollable range.
3. **SubHeader Behavior**: The sub-header area is not sticky, so it scrolls away naturally as you move down the page.