# Sistema de Contratos — Guia de Integração

Este documento descreve como utilizar o módulo de contratos no frontend e como as regras de backend funcionam.

## 1. Como Criar um Template (Admin)
Os templates são salvos em Markdown e suportam injeção de dados via Handlebars.

**Exemplo de Conteúdo:**
```markdown
# Contrato de Prestação de Serviços
Eu, {{user.name}}, portador do documento {{user.taxId}}, aceito os termos...
```

**Campos Disponíveis para Injeção:**
- `user.name`, `user.taxId`, `user.email`, `user.address`
- `school.name`, `school.legalName`, `school.taxId`
- `contract.date`

---

## 2. Fluxo de Assinatura (Frontend)
Para assinar um contrato, utilize a Server Action `signContractAction`.

### Sugestão de UI (Vault)
Use o componente `Vault` para exibir o contrato antes da assinatura.

```tsx
"use client";
import { signContractAction } from "@/modules/contract/contract.actions";
import { notify } from "@/components/ui/toaster";
import { Vault } from "@/components/ui/vault";

export function SignContractVault({ instanceId, content }) {
  const handleSign = async () => {
    const result = await signContractAction({ instanceId });
    if (result.success) {
      notify.success("Contrato assinado com sucesso!");
    } else {
      notify.error(result.error);
    }
  };

  return (
    <Vault title="Assinar Contrato">
      <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
        <Markdown>{content}</Markdown>
      </div>
      <Button onClick={handleSign}>Concordar e Assinar</Button>
    </Vault>
  );
}
```

---

## 3. Cancelamento e Taxas
O cancelamento segue uma lógica condicional:
1. **Solicitação**: O usuário clica em "Cancelar".
2. **Check de Taxa**: O sistema verifica se é o último mês do ciclo.
   - **Sim**: Cancela imediatamente (`success: true, feeRequired: false`).
   - **Não**: Retorna um PIX para pagamento da taxa de 50% (`success: true, feeRequired: true, pixCode: "..."`).
3. **Webhook**: Assim que o PIX é pago, o Billing avisa o Contract Service, que move o status para `cancelled`.

---

## 4. Renovação Automática
- Se o campo `autoRenew` estiver como `true`, no vencimento o sistema criará uma nova instância.
- **Auto-Sign**: A nova instância será marcada como `signed` automaticamente, reaproveitando os metadados de integridade da assinatura original, e enviando o e-mail de renovação.

---

## 5. Visualização de PDFs
Os PDFs são armazenados no Firebase Storage.
- URL de acesso: Gerada via `getDownloadURL` no cliente, ou servida via Proxy se necessário.
- Sugestão: Use um `<iframe>` ou o componente `<embed>` para exibir o PDF diretamente no Vault de detalhes do contrato.
