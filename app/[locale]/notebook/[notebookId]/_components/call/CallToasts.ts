import { toast } from "sonner";

const toastStyleBase = {
  borderRadius: "12px",
  color: "#fff",
  textAlign: "center" as const,
  padding: "12px",
  fontSize: "0.95rem",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export const showCanceledCallToast = () =>
  toast("Chamada Cancelada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#EAB308" },
  });

export const showJoinedCallToast = () =>
  toast("Sala Criada!", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#22C55E" },
  });

export const showLeftCallToast = () =>
  toast("Você saiu da chamada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#6366F1" },
  });

export const showEndedCallToast = () =>
  toast("Chamada Encerrada", {
    position: "bottom-center",
    style: { ...toastStyleBase, background: "#EF4444" },
  });
