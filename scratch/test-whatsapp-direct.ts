async function testDirect() {
  const PHONE_NUMBER_ID = "996116523582282";
  const ACCESS_TOKEN = "EAAbuGrPtpkoBRS28teBBBzxerqJ6Q4sdVLWtUfgamNvdWgLQZBGQBM04cqOgvlZADDdOQAlMfZBa5pXlO5ZATWVZCQL3w3UKjXXBRQsbHhzZC5Vz9mHXqoWdaofTl8LoiLHciUi6qZBZAaHJ7eJQxu8MPbb2nfQM52LTP3VaKoXiTLQSSJvLLz5VV8CsNDAThfl1wfgdzfxxydbLPNzwF9ud86xQsAUE3e8IUfiloIZASkedp8CMpxQtAeYO3TUHW6hyZBM840x49tkwKY5FuuJkCuCwZDZD";
  const RECIPIENT = "5549936180608";

  console.log("🚀 Enviando mensagem direta para o WhatsApp...");

  const body = {
    messaging_product: "whatsapp",
    to: RECIPIENT,
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
    }
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Sucesso! Resposta da API:", JSON.stringify(data, null, 2));
    } else {
      console.log("❌ Erro da API Meta:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro de rede:", error);
  }
}

testDirect();
