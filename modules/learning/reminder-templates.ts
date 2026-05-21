export interface ReminderTemplate {
  title: string;
  body: string;
}

export const REMINDER_TEMPLATES: Record<
  "daily" | "streak" | "roadmap",
  ReminderTemplate[]
> = {
  daily: [
    {
      title: "Hora de praticar! 🚀",
      body: "Garanta sua evolução diária com 5-10 minutos de prática."
    },
    {
      title: "Seu inglês está com saudades... 🥺",
      body: "Apenas 5 minutinhos hoje para manter o ritmo. Vamos lá?"
    },
    {
      title: "Toc, toc! Quem é? 🚪",
      body: "A oportunidade de falar inglês fluente batendo na sua porta. Pratique agora!"
    },
    {
      title: "Desafio do dia aceito? ⚡",
      body: "Apenas uma lição curta nos separa da meta de hoje. Vamos nessa, {name}?"
    },
    {
      title: "Investimento diário em você! 📈",
      body: "5 minutos de prática valem mais que horas de teoria acumulada. Vem praticar!"
    },
    {
      title: "Um pequeno passo hoje, um grande salto amanhã! 👣",
      body: "Complete a prática de hoje e fique mais perto do seu objetivo."
    },
    {
      title: "Não deixe seu inglês enferrujar! ⚙️",
      body: "A prática diária é o óleo que mantém as engrenagens da fluência girando. Vamos praticar?"
    },
    {
      title: "Que tal 5 minutos de evolução? ⏱️",
      body: "{name}, sua meta de hoje te espera. Vamos acelerar esse aprendizado!"
    }
  ],
  streak: [
    {
      title: "Sua ofensiva está em risco! 🔥",
      body: "Não deixe sua sequência de {streak} dias acabar. Pratique agora!"
    },
    {
      title: "Rápido, salve sua ofensiva! 🚨",
      body: "Falta muito pouco para bater a meta. Proteja seus {streak} dias com 3 minutos de prática!"
    },
    {
      title: "O fogo vai apagar? 🚒",
      body: "Sua sequência de {streak} dias está piscando em vermelho! Entre e salve-a!"
    },
    {
      title: "Não jogue seu esforço fora! 🗑️",
      body: "Você batalhou por {streak} dias seguidos. Pratique hoje para manter o fogo aceso!"
    },
    {
      title: "{streak} dias de glória não podem parar! 🏆",
      body: "Sua ofensiva é lendária, {name}. Mantenha ela viva praticando agora!"
    },
    {
      title: "O passarinho está de olho... 👀",
      body: "Ele avisou que seus {streak} dias de ofensiva correm perigo. Vai deixar apagar?"
    },
    {
      title: "A chama da fluência te convoca! 🔥",
      body: "Manter seus {streak} dias de ofensiva exige apenas uma lição hoje. Aceita?"
    },
    {
      title: "Mais um dia, mais uma vitória! 👑",
      body: "Não quebre o hábito que te levou a {streak} dias. Faça a lição de hoje!"
    }
  ],
  roadmap: [
    {
      title: "Conteúdo novo esperando! 📚",
      body: "Você tem lições pendentes no seu roteiro. Vamos colocar o inglês em dia?"
    },
    {
      title: "Próxima parada: Fluência! 🗺️",
      body: "Seu roteiro de estudos tem lições fresquinhas esperando por você. Vamos desbravá-las?"
    },
    {
      title: "Desbloqueie novas habilidades! 🔓",
      body: "O conteúdo que você precisa está disponível no seu roadmap. Que tal ver agora?"
    },
    {
      title: "Não deixe acumular! 📦",
      body: "Lições pendentes detectadas no seu roteiro. 5 minutos resolvem isso, {name}!"
    },
    {
      title: "Sua jornada pedagógica continua! 🚀",
      body: "Tem lições agendadas esperando pelo seu progresso. Vamos avançar?"
    },
    {
      title: "Um novo capítulo te espera 📖",
      body: "Coloque suas lições do roteiro em dia e destrave seu próximo nível!"
    }
  ]
};
