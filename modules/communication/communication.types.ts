export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "footer" | "button";
  sub_type?: "quick_reply" | "url" | "copy_code";
  index?: string;
  parameters: WhatsAppParameter[];
}

export interface WhatsAppParameter {
  type: "text" | "image" | "document" | "video" | "currency" | "date_time" | "payload";
  parameter_name?: string; // Para templates que exigem nomes em vez de {{1}}
  text?: string;
  image?: { link: string };
  document?: { link: string; filename?: string };
  video?: { link: string };
  payload?: string;
}

export interface SendWhatsAppTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export interface WhatsAppRequestBody {
  messaging_product: "whatsapp";
  to: string;
  type: "template" | "text"; // Expandir se necessário
  template?: {
    name: string;
    language: { code: string };
    components?: WhatsAppTemplateComponent[];
  };
  text?: {
    body: string;
  };
}

export interface WhatsAppMetaComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: string;
  buttons?: unknown[];
}

export interface WhatsAppTemplate {
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DELETED";
  category: "AUTHENTICATION" | "MARKETING" | "UTILITY";
  language: string;
  components: WhatsAppMetaComponent[];
  id: string;
}

export interface WhatsAppTemplateListResponse {
  data: WhatsAppTemplate[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface WhatsAppConversation {
  id: string;
  waId: string;
  studentId: string | null;
  lastMessageContent: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  content: string | null;
  type: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read" | "failed";
  metadata: unknown;
  createdAt: Date | string;
}

