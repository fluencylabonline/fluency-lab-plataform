import { CommunicationService } from "../modules/communication/communication.service";

async function test() {
  // Configuração manual para o teste (Substituindo o que viria do .env)
  process.env.WHATSAPP_PHONE_NUMBER_ID = "996116523582282";
  process.env.WHATSAPP_ACCESS_TOKEN = "EAAbuGrPtpkoBRS28teBBBzxerqJ6Q4sdVLWtUfgamNvdWgLQZBGQBM04cqOgvlZADDdOQAlMfZBa5pXlO5ZATWVZCQL3w3UKjXXBRQsbHhzZC5Vz9mHXqoWdaofTl8LoiLHciUi6qZBZAaHJ7eJQxu8MPbb2nfQM52LTP3VaKoXiTLQSSJvLLz5VV8CsNDAThfl1wfgdzfxxydbLPNzwF9ud86xQsAUE3e8IUfiloIZASkedp8CMpxQtAeYO3TUHW6hyZBM840x49tkwKY5FuuJkCuCwZDZD";

  const communicationService = new CommunicationService();

  console.log("🚀 Iniciando teste de WhatsApp...");
  
  const result = await communicationService.sendWhatsAppTemplate({
    to: "5549936180608",
    templateName: "hello_world",
    languageCode: "en_US"
  });

  if (result) {
    console.log("✅ Sucesso! Resposta da API:", JSON.stringify(result, null, 2));
  } else {
    console.log("❌ Falha no envio. Verifique os logs acima.");
  }
}

test().catch(console.error);
