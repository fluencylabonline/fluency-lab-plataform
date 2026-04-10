---
trigger: always_on
---

# DESIGN SYSTEM & UI/UX RULES (FLUENCYLAB)

## 1. Princípios Básicos
- **Mobile-First Real:** Programe sempre a versão mobile primeiro (`className="flex flex-col md:flex-row"`) use touch targets >= 44x44px.
- **Espaçamento e Tipografia:** Use o sistema de 8px (Tailwind `p-2`, `m-4`, `gap-4`). Use fontes e cores baseadas no Tailwind e na configuração global do `theme`.
- **Nunca use shadow nos componentes**
- **Nunca use Dialog ou Modais normais, sempre use o Vault component**
- **Vaults funcionam normais no Desktop/Tablet/Mobile, mas no PWA eles devem ser floaty (Separados dos cantos)**

## 2. Componentes Adaptativos (Regra de Ouro)
### Responsive Behavior
* **Sidebar:**
    * **Desktop:** Left side Collapsible with icons and SidebarTrigger.
    * **Mobile:** Bottom side Vault with trigger.
* **Dropdowns:** (Já existe em components/ui/dropdown-menu)
    * **Desktop:** Default.
    * **Mobile:** Vault.
* **Dialogs/Alerts/Confirmation:** Always Vault. (Já existe em components/ui/vault)
* **Forms:** ShadCN + ReactHookForm.

### Search UX
* Always include empty states components when using it.

### Header Component (Já existe em components/layout/header)
* **Desktop:** * *Left:* BackButton when in sub-page.
    * *Center:* Title.
    * *Right:* ThemeToggle, Notification and Avatar (Logout and Profile).
    * *Sub.Header:* Subtitle and SearchButton/SearchInput/ActionButton.
* **Tablet:** * *Left:* BackButton when in sub-page.
    * *Center:* Title.
    * *Right:* ThemeToggle, Notification and Avatar (Logout and Profile).
    * *Sub.Header:* Subtitle and SearchButton/SearchInput/ActionButton.
* **Mobile and PWA:** * *Left:* BackButton when in sub-page.
    * *Right:* SearchButton/ActionButton, Avatar Dropdown with: ThemeToggle, Notification, Logout and Profile.
    * *Sub.Header:* Title and subtitle.
    > *Obs: SearchButton takes full width of Header*

- **Header is sticky always. Sub.Header is not sticky.**

### Theming
* Multi-theme-colors support
* Light/dark modes

## 3. Interação e Feedback
- Todo botão ou link DEVE ter um estado de *loading* claro (spinner) durante mutações via Server Actions.
- Animações (Framer Motion) devem ser curtas (< 200ms) e objetivas, evitando exageros visuais.
- Sempre mostre um Toast (`sonner`) após o retorno de uma Server Action (sucesso ou erro).

## 4. Empty States e Tratamento de Erros
- Nenhuma tela deve ficar em branco se não houver dados, principalmente em buscas ou páginas que deviam mostrar dados. Sempre exiba um componente `<EmptyState />` com ícone, mensagem amigável e um CTA (Call to Action).