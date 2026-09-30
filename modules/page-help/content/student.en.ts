import type { RoleHelpContent, StudentHelpRoute } from "../page-help.types";

/**
 * Ajuda das páginas do aluno — inglês.
 *
 * Tradução de `student.pt.ts`, não um texto novo: mesmos `id` de passo, mesma
 * quantidade de seções e a mesma ordem. O registry avisa no console (em
 * desenvolvimento) se os dois arquivos divergirem.
 */
export const STUDENT_HELP_EN: RoleHelpContent<StudentHelpRoute> = {
  "/hub/student/profile": {
    panel: "wizard",
    title: "My Profile",
    summary:
      "Your home page: next class, payment status, progress and achievements, all in one place.",
    docsArticleId: "aluno-visao-geral",
    tour: [
      {
        id: "intro",
        title: "This is your home page",
        text: "Everything that needs your attention shows up here: your next class, this month's payment and how you are progressing. Let's go through each part.",
      },
      {
        id: "next-class",
        target: "student-profile.next-class",
        title: "Your next class",
        text: "Date, time and teacher of your next scheduled class. When the time comes, the Join Room button opens the video call. With nothing scheduled, the card tells you your calendar is empty.",
      },
      {
        id: "payment",
        target: "student-profile.payment",
        title: "Your payment status",
        text: "Shows your plan and whether this month's invoice is paid or open. If an invoice is overdue, a notice appears with the PIX code so you can settle it right away.",
      },
      {
        id: "onboarding",
        target: "student-profile.onboarding",
        title: "What is still pending",
        text: "The first three steps of your enrolment: signing the contract, taking the placement test and opening your first course. Tap any pending item to go straight to it.",
      },
      {
        id: "progress",
        target: "student-profile.progress",
        title: "How you are progressing",
        text: "Content retention, vocabulary level and how many classes of your cycle have happened. Just below are your streak of consecutive days and a reminder when daily practice is pending.",
      },
      {
        id: "badges",
        target: "student-profile.badges",
        title: "Your proficiency levels",
        text: "Each icon stands for a stage of your fluency. Tap to see every stage and where you are. If you have not taken the placement test yet, the card invites you to start.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Getting around the platform",
        text: "This is how you reach your Notebook, Calendar, Courses, Immersion and Settings. On a phone, this menu sits in the bottom bar.",
      },
      {
        id: "notifications",
        target: "chrome.notifications",
        title: "Your alerts",
        text: "The bell holds the school's alerts: class reminders, payment confirmations, messages from your teacher. The number on it is how many you have not read.",
        only: "desktop",
      },
      {
        id: "theme",
        target: "chrome.theme",
        title: "Light or dark",
        text: "Switches the platform's look between light, dark or following your device. On a phone this option lives inside the menu behind your photo.",
        only: "desktop",
      },
      {
        id: "account",
        target: "chrome.account",
        title: "Your account",
        text: "Your photo opens the account menu: profile, settings, language and sign out. On a phone it is also where the theme and the language live.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "This button is on every page",
        text: "The (?) is on every screen and always explains the page you are on — including a walkthrough like this one.",
      },
    ],
  },

  "/hub/student/schedule": {
    panel: "wizard",
    title: "My Schedule",
    summary:
      "Your class calendar: this is where you cancel, reschedule and keep track of your make-up credits.",
    docsArticleId: "aluno-calendario",
    tour: [
      {
        id: "intro",
        title: "Your class calendar",
        text: "All your classes show up here, month by month. This walkthrough shows how to cancel, how to reschedule and what each status means.",
      },
      {
        id: "calendar",
        target: "student-schedule.calendar",
        title: "The calendar",
        text: "Each mark is a class. Click one to see date, time, teacher and status — and to cancel or reschedule it. The calendar always opens on the current month.",
      },
      {
        id: "credits",
        target: "student-schedule.credits",
        title: "Your credits and your monthly quota",
        text: "The monthly quota lets you reschedule up to 2 classes per calendar month, and it does not carry over to the next month. Make-up credits are separate: they come from teacher cancellations, school bonuses or delays on our side.",
        only: "desktop",
      },
      {
        id: "credits-mobile",
        target: "student-schedule.credits-button",
        title: "Your credits and your monthly quota",
        text: "Tap Credits to see this month's quota (2 reschedules, no carry-over) and your make-up credits, which come from teacher cancellations or school bonuses.",
        only: "mobile",
      },
      {
        id: "reschedule",
        target: "student-schedule.calendar",
        title: "Rescheduling a class",
        text: "Open the class and choose Reschedule. The system lists your teacher's free slots over the next 14 days and asks whether to spend your monthly quota or a make-up credit.",
      },
      {
        id: "cancel",
        target: "student-schedule.calendar",
        title: "The 4-hour rule",
        text: "Cancelling more than 4 hours ahead is a regular cancellation. With less than 4 hours, the class is recorded as a no-show — and a no-show counts as a class given, with no make-up. Inside that window you can no longer reschedule either.",
      },
      {
        id: "status",
        target: "student-schedule.calendar",
        title: "What each status means",
        text: "Scheduled is confirmed. Completed already happened. No-show means a last-minute cancellation or arriving more than the 15 minutes of tolerance late. Cancelled by teacher gives you a make-up credit. Recess is a break announced by your teacher, with an activity in place of the class.",
      },
    ],
  },

  "/hub/student/notebook": {
    panel: "wizard",
    title: "My Notebook",
    summary:
      "The notes from all your classes, your lesson path and a summary of what you have already learned.",
    docsArticleId: "aluno-caderno",
    tour: [
      {
        id: "intro",
        title: "Your class notebook",
        text: "Every class creates a page here, with what was covered and your teacher's remarks. It is the best place to review before your next class.",
      },
      {
        id: "stats",
        target: "student-notebook.stats",
        title: "Your progress in numbers",
        text: "How many items you reviewed today, how many are waiting for review and how many you already count as learned. Tap Reviewed or Learned to see the full list, split between vocabulary and structure.",
      },
      {
        id: "path",
        target: "student-notebook.path",
        title: "Your lesson path",
        text: "The path shows the lessons of the plan your teacher put together, day by day. Locked ones open as you reach them. With no active plan, the path tells you to talk to your teacher.",
      },
      {
        id: "notebooks",
        target: "student-notebook.notebooks",
        title: "Your notes by class",
        text: "The list of notebooks, one per class, searchable by name. Open one to read the notes or download it as a PDF.",
        only: "desktop",
      },
      {
        id: "notebooks-mobile",
        target: "student-notebook.notebooks-button",
        title: "Your notes by class",
        text: "Tap Notebooks to see the list, one notebook per class, searchable by name. Open one to read the notes or download it as a PDF.",
        only: "mobile",
      },
      {
        id: "wotd",
        target: "student-notebook.wotd",
        title: "Word of the Day",
        text: "One new word a day, with meaning, pronunciation and an example, plus a quick exercise to make it stick. It takes under a minute.",
      },
      {
        id: "attachments",
        title: "Attachments expire",
        text: "Files and images attached to classes stay available for a while and are then removed automatically. If some material matters to you, download and keep it.",
      },
    ],
  },

  "/hub/student/settings": {
    panel: "wizard",
    title: "Settings",
    summary:
      "Your details, language, theme, which alerts you receive and your account security.",
    docsArticleId: "aluno-configuracoes",
    tour: [
      {
        id: "intro",
        title: "Your account settings",
        text: "Five tabs, one subject each. Let's see what lives in each one.",
      },
      {
        id: "tabs",
        target: "settings.tabs",
        title: "The tabs",
        text: "Account holds your details, email and platform language. Appearance switches between light and dark. Notifications picks which alerts you get. Security covers your password and two-step verification. App installs the platform on your phone.",
      },
      {
        id: "account",
        target: "settings.tabs",
        title: "Account tab",
        text: "Photo, name, primary email (with a verified badge) and the interface language. It is also where Export My Data lives, which downloads a copy of everything we hold about you, along with the account cancellation request.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Notifications tab",
        text: "One switch per kind of alert: classes and scheduling, streak reminders (after 8pm), new lesson alerts, chat messages and school news. Turning class alerts off means no reminder before each class — payment alerts keep coming, as they are a contractual obligation.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Security tab",
        text: "Change your password here from time to time. Two-step verification uses an authenticator app (Google Authenticator, Authy) and starts asking for a 6-digit code at every sign-in — it is the strongest protection for your account.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "App tab",
        text: "Installs the platform as an app on your phone or computer: it opens faster, fills the whole screen and can deliver class alerts.",
      },
    ],
  },

  "/hub/student/placement": {
    panel: "wizard",
    title: "Placement",
    summary:
      "The test that measures your level in the language, plus the history of every test you have taken.",
    docsArticleId: "aluno-nivelamento",
    tour: [
      {
        id: "intro",
        title: "What the placement test is for",
        text: "The test measures where you are in the language. The result guides your teacher when planning lessons and gives you a marker to track your progress. It is not an exam: there is no good or bad score, there is a starting point.",
      },
      {
        id: "start",
        target: "student-placement.start",
        title: "Starting a placement test",
        text: "Start Assessment opens the test. It is adaptive: it begins easy and adjusts to how you are doing, and takes 10 to 15 minutes.",
      },
      {
        id: "resume",
        target: "student-placement.start",
        title: "Test in progress",
        text: "If you left in the middle, the card switches to Resume Test and takes you back exactly where you stopped — your progress is saved. You have to finish the test in progress before starting another.",
      },
      {
        id: "cooldown",
        target: "student-placement.start",
        title: "One test every 6 months",
        text: "So the result means something, there is a 6-month gap between placement tests. Within that gap, the screen shows the date your next one unlocks.",
      },
      {
        id: "history",
        target: "student-placement.history",
        title: "Your results",
        text: "Every completed test is kept here with its level and date. Open one to see the estimated level, how many questions you got right and the breakdown by skill. Comparing two results is the most direct way to see your progress.",
      },
    ],
  },

  "/hub/student/placement/test": {
    title: "Placement Test",
    summary:
      "The test itself: questions that adjust to how you are doing until they find your level.",
    docsArticleId: "aluno-nivelamento",
    sections: [
      {
        heading: "How the test works",
        body: "It is adaptive: it starts with easy questions and adjusts the difficulty as you get answers right or wrong, until it finds your real level. It takes 10 to 15 minutes in total.",
      },
      {
        heading: "The buttons on screen",
        body: [
          "Check confirms the answer you picked and tells you right away whether it was right, showing the correct solution when it was not.",
          "Skip moves past a question unanswered — worth using when you genuinely do not know, since guessing distorts the result.",
          "Continue moves to the next question after the feedback.",
          "On audio questions, the player replays the sound as many times as you like.",
        ],
      },
      {
        heading: "If you need to leave",
        body: "You can leave midway: your progress is saved and the Placement page shows Resume Test so you can pick up where you stopped. You just cannot start a new test before finishing this one.",
      },
      {
        heading: "Answer without looking things up",
        body: "There is no good or bad score — there is a starting point. An inflated result only gets in the way of planning your lessons.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "You are in the test",
        text: "Take your time and do not look anything up. The test adjusts to how you are doing, so getting things wrong is part of it — that is how it finds your level.",
      },
      {
        id: "question",
        target: "placement-test.question",
        title: "The question",
        text: "It can be multiple choice, free text, word ordering or listening comprehension. On audio questions, the player replays the sound as often as you need.",
      },
      {
        id: "actions",
        target: "placement-test.actions",
        title: "Check and Skip",
        text: "Check confirms your answer and tells you right away whether it was right, with the solution when it was not. Skip moves on unanswered — better to skip than to guess.",
      },
      {
        id: "exit",
        title: "Leaving midway is safe",
        text: "If you need to stop, your progress is saved and you come back where you left off from the Placement page.",
      },
    ],
  },

  "/hub/student/payments": {
    title: "Payments",
    summary:
      "Every instalment of your plan, with amount, due date, status and the PIX code for each one.",
    docsArticleId: "aluno-mensalidades",
    sections: [
      {
        heading: "What the list shows",
        body: "One row per instalment, with amount, due date and status (paid, open or overdue). The due date always falls between the 1st and the 10th of each month.",
      },
      {
        heading: "How to pay",
        body: [
          "Tap the open instalment to see the payment details.",
          "Scan the QR code with your banking app or use Copy Code to paste the PIX code.",
          "Check the amount in your bank and confirm.",
          "Clearing is automatic and usually happens within a few minutes.",
        ],
      },
      {
        heading: "The buttons on each instalment",
        body: [
          "View receipt appears on paid instalments and opens the proof of payment.",
          "Copy Code copies the PIX code for your banking app.",
          "I already paid, check payment asks the bank again when clearing is slow.",
          "Generate new PIX appears on an overdue instalment and creates a fresh code, since the old one expires.",
          "Go to Payment appears on plans billed in dollars and opens Stripe's secure page for international cards.",
        ],
      },
      {
        heading: "Always use the PIX code from here",
        body: "A payment sent to any other PIX key is not recognised automatically, and your instalment stays open until someone checks it by hand. Always use the code generated on this screen.",
      },
      {
        heading: "Overdue instalment",
        body: "A fixed notice appears at the top of the platform and disappears on its own once the payment is confirmed. You also get reminders by email and WhatsApp 2 days before, on the day and after the due date. If you have paid and the notice is still there, wait a few minutes: confirmation depends on your bank.",
      },
      {
        heading: "Annual adjustment",
        body: "Every July the monthly fee is adjusted by inflation indexes (IPCA/IGPM). Formal notice arrives through the platform 30 days in advance.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your invoices",
        text: "Every instalment of your plan lives in this list, from the most recent back through the earlier ones.",
      },
      {
        id: "list",
        target: "student-payments.list",
        title: "Each instalment",
        text: "Amount, due date and status. Open instalments expand on tap and show the payment details; paid ones carry the receipt button.",
      },
      {
        id: "pix",
        target: "student-payments.list",
        title: "Paying with PIX",
        text: "Open the pending instalment and use the QR code or Copy Code. Always pay with this code: a PIX sent to another key will not clear automatically.",
      },
      {
        id: "verify",
        target: "student-payments.list",
        title: "I paid and it is still open",
        text: "Use I already paid, check payment to ask the bank again. On an overdue instalment, Generate new PIX creates a valid code, because the old one expires.",
      },
    ],
  },

  "/hub/student/contract": {
    title: "Your Contract",
    summary:
      "The contract for your enrolment: where to read it, sign it digitally and download the PDF.",
    docsArticleId: "aluno-contrato",
    sections: [
      {
        heading: "What lives on this screen",
        body: "The service contract for your enrolment, with its validity and current status: Active Contract, Signature Pending or Expired Contract. When expiry is close, a notice shows how many days are left.",
      },
      {
        heading: "The buttons",
        body: [
          "Download PDF saves a copy of the contract to your device.",
          "Receive by Email sends the PDF to your account's email address.",
          "If a signature is pending, the screen shows the terms and the button to sign digitally.",
        ],
      },
      {
        heading: "End-of-year teaching recess",
        body: "The school has a mandatory recess over the last two weeks of December and the first two of January. Live classes stop, but monthly fees stay in full, with no discount. You can choose to receive activities to do in your own time during the period.",
      },
      {
        heading: "Cancelling before the contract ends",
        body: "Ending your enrolment mid-term requires 15 working days' notice and carries a termination fee of 50% of the following month's fee. In the case of termination for misconduct, removal is immediate.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your contract",
        text: "This is where your enrolment contract lives, to read, to sign and to keep.",
      },
      {
        id: "status",
        target: "student-contract.status",
        title: "Status and validity",
        text: "Shows whether the contract is active, waiting for your signature or expired, and how long it runs. Close to the end, a notice tells you how many days remain.",
      },
      {
        id: "actions",
        target: "student-contract.actions",
        title: "Download and email",
        text: "Download PDF saves a copy to your device. Receive by Email sends the file to your account's email — handy for keeping it outside the platform.",
      },
      {
        id: "rules",
        title: "Two rules that tend to surprise people",
        text: "The end-of-year recess (last two weeks of December, first two of January) pauses classes but not the monthly fee. And cancelling mid-contract requires 15 working days' notice and carries a fee of 50% of the following month.",
      },
    ],
  },

  "/hub/student/courses": {
    title: "Courses",
    summary: "The video courses available to you, to study at your own pace.",
    docsArticleId: "aluno-cursos",
    sections: [
      {
        heading: "What lives here",
        body: "The recorded courses the school has made available to you, each showing how much you have already watched. Open a course to see its sections and lessons.",
      },
      {
        heading: "Your progress is saved",
        body: "You can stop in the middle of a lesson and carry on later from where you were, even on another device. Nothing needs to be marked by hand for that to work.",
      },
      {
        heading: "Missing a course you expected?",
        body: "Courses are released by the school according to your plan and your stage in the programme. If something seems missing, talk to your teacher or the school office.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your video courses",
        text: "Recorded content for you to study whenever you like, alongside your classes with your teacher.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "The course list",
        text: "Each card is a course available to you, with the progress you have made. Tap it to open and start watching.",
      },
      {
        id: "progress",
        title: "You can stop midway",
        text: "Your progress is saved automatically, so you can carry on later — even on another device.",
      },
    ],
  },

  "/hub/student/courses/[id]": {
    title: "Watching the course",
    summary:
      "The course player: the lesson content, the lesson menu and the quiz for each stage.",
    docsArticleId: "aluno-cursos",
    sections: [
      {
        heading: "How the screen is laid out",
        body: "The lesson content sits in the middle and the lesson list in the side menu, grouped by section. Completed lessons appear ticked. On a phone, use the Menu button to open and close that list.",
      },
      {
        heading: "The buttons",
        body: [
          "Mark as completed records the lesson as done and updates your progress bar.",
          "Previous and Next move between lessons in course order.",
          "Menu opens the lesson list on a phone.",
        ],
      },
      {
        heading: "Quizzes",
        body: "Some lessons end with a quiz. Finish Quiz marks it and shows how many questions you got right; Practise Again retakes it as often as you like. Your last attempt is kept.",
      },
      {
        heading: "The side menu is hidden here",
        body: "So you can watch without distraction, the platform menu is hidden on this screen. Use the back button at the top to leave the course.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The course player",
        text: "This is the study screen. Let's look at the content, the lesson menu and how to record your progress.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "The lesson",
        text: "Video, text or both, depending on the lesson. When a lesson has no content published yet, the screen says so.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "The course lessons",
        text: "The full list, grouped by section, with completed ones ticked. Tap any lesson to jump straight to it.",
      },
      {
        id: "complete",
        target: "student-course-player.complete",
        title: "Mark as completed",
        text: "Records the lesson as done and updates your progress bar. Previous and Next follow the course order.",
      },
    ],
  },

  "/hub/student/practice": {
    title: "Daily Practice",
    summary:
      "Your exercise path that adjusts to your level, plus your lesson roadmap and history.",
    docsArticleId: "aluno-pratica",
    sections: [
      {
        heading: "The three tabs",
        body: [
          "Practice holds your path for the current plan, day by day, and is where you start today's session.",
          "Roadmap shows the journey of lessons your teacher has planned for you.",
          "History keeps the plans you have already completed.",
        ],
      },
      {
        heading: "How practice adjusts to you",
        body: "The exercises are short and take into account your level and what you got wrong in recent sessions. Every session you finish earns XP and feeds your roadmap.",
      },
      {
        heading: "Redoing a day you already did",
        body: "Completed days can be redone by spending XP. The screen shows your balance, the cost of the replay and what your balance becomes — and warns you when your XP is not enough.",
      },
      {
        heading: "Consistency beats intensity",
        body: "A few minutes every day works better than a weekend marathon. The platform can remind you by notification; that is set in the Notifications tab of Settings.",
      },
      {
        heading: "No active plan?",
        body: "The path only exists once your teacher has put your study plan together. If the screen is empty, talk to them.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your daily practice",
        text: "Short exercises, built for your level, reinforcing exactly what has not stuck yet.",
      },
      {
        id: "xp",
        target: "student-practice.xp",
        title: "XP and streak",
        text: "Your accumulated XP and your run of consecutive practice days. XP is also the currency for redoing a day you have already completed.",
      },
      {
        id: "tabs",
        target: "student-practice.tabs",
        title: "The three tabs",
        text: "Practice is today's path. Roadmap is the journey of lessons your teacher planned. History keeps your completed plans.",
      },
      {
        id: "path",
        target: "student-practice.path",
        title: "The path",
        text: "Each node is a day of the plan. The one marked TODAY is your session right now; earlier ones can be redone by spending XP, and the ones ahead open as you progress.",
      },
      {
        id: "rhythm",
        title: "A little every day",
        text: "A few minutes a day pays off more than a marathon. If you want a nudge, turn on reminders in the Notifications tab of Settings.",
      },
    ],
  },

  "/hub/student/practice/session": {
    title: "Practice session",
    summary:
      "The day's exercise session: flashcards, gap fills, listening, quizzes and sentences to reorder.",
    docsArticleId: "aluno-pratica",
    sections: [
      {
        heading: "The kinds of exercise",
        body: [
          "Flashcard shows the word on one side and the meaning on the other, with pronunciation audio.",
          "Gap fill asks for the word missing from a sentence.",
          "Listen and choose plays audio and asks for the right option.",
          "Quiz is a question with options.",
          "Reorder the sentence asks you to put the words in the right order.",
        ],
      },
      {
        heading: "Feedback on every answer",
        body: "After each answer you see right away whether it was correct, with the right solution when it was not. Getting things wrong is not a problem: it is exactly what tells the path what needs to come back more often.",
      },
      {
        heading: "Leaving midway",
        body: "The exit button asks for confirmation first, so you do not lose the session to a stray tap.",
      },
      {
        heading: "When you finish",
        body: "The summary shows your correct answers and the XP earned in the session, and the path marks the day as completed.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Today's session",
        text: "A handful of short exercises, of different kinds. Let's look at the screen.",
      },
      {
        id: "progress",
        target: "practice-session.progress",
        title: "Where you are in the session",
        text: "The bar at the top shows how much is left, along with the exit button, which always asks for confirmation first.",
      },
      {
        id: "exercise",
        target: "practice-session.exercise",
        title: "The exercise",
        text: "It can be a flashcard, a gap fill, listening, a quiz or reordering a sentence. On the ones with sound, the listen button replays it as often as you like.",
      },
      {
        id: "feedback",
        title: "Getting it wrong is part of it",
        text: "After each answer you see the result and the correct solution. What you get wrong comes back more often in later sessions — that is how the path adjusts to you.",
      },
    ],
  },

  "/hub/student/immersion": {
    title: "My Immersion",
    summary: "Games and free activities to practise on your own, in a light way.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "What is here",
        body: [
          "Wordle: guess the word of the day. Works on vocabulary and spelling.",
          "Lyrics: fill in song lyrics as you listen. Trains listening comprehension.",
          "Word Ladder: turn one word into another, changing one letter at a time.",
          "Podcasts and Blog appear marked Coming soon — they are not available yet.",
        ],
      },
      {
        heading: "These are free activities",
        body: "They are not graded and they do not replace daily practice or your classes. They are there to keep you in touch with the language without any weight.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Practising through play",
        text: "This area gathers games to keep you in touch with the language outside your classes. Nothing here is graded.",
      },
      {
        id: "activities",
        target: "student-immersion.activities",
        title: "The activities",
        text: "Wordle trains vocabulary and spelling. Lyrics trains listening with music. Word Ladder turns one word into another, a letter at a time. Tap any of them to start.",
      },
      {
        id: "soon",
        title: "Coming soon",
        text: "Podcasts and Blog appear in the list marked Coming soon. They do not open yet — they are there so you know they are on the way.",
      },
    ],
  },

  "/hub/student/immersion/wordle": {
    title: "Wordle",
    summary: "Guess the word of the day in up to six tries.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "How to play",
        body: "Type a word of the length shown and confirm. The letters change colour: in the right position, present in the word but elsewhere, or not in the word at all. Use those hints to work your way to the answer.",
      },
      {
        heading: "The controls",
        body: [
          "The on-screen keyboard works alongside your device keyboard, and keeps the colours of the letters you have already tried.",
          "The language selector picks which language you play in.",
          "The history icon shows the words from previous days.",
          "Once the round is over, tap any word you learned to see its meaning, pronunciation and an example.",
        ],
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The word of the day",
        text: "Work out the word using the colours as clues. One new word each day.",
      },
      {
        id: "board",
        target: "immersion-wordle.board",
        title: "The board",
        text: "Each row is one try. After you confirm, the colours tell you which letters are in the right position, which exist elsewhere in the word and which are not in it.",
      },
      {
        id: "keyboard",
        target: "immersion-wordle.keyboard",
        title: "The keyboard",
        text: "It works alongside your device keyboard and keeps the colours of the letters you have tried — so you do not have to hold them in your head.",
      },
      {
        id: "extras",
        target: "immersion-wordle.toolbar",
        title: "Language and history",
        text: "Switch the game's language in the selector and see previous days' words in the history. At the end of a round, tap a word to see its meaning and pronunciation.",
      },
    ],
  },

  "/hub/student/immersion/lyrics": {
    title: "Lyrics Training",
    summary:
      "Fill in the song lyrics as the track plays, training your listening comprehension.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "How to play",
        body: "Pick a song from the search, by title or artist. The song plays and you type the missing words in the lyrics, line by line.",
      },
      {
        heading: "Before you start",
        body: [
          "The search accepts a song title or an artist name.",
          "Confirm the song and the artist in the two fields below the search.",
          "Pause every chooses whether the song stops every 1 line or every 2 lines — 1 line is easier.",
          "Start begins playback. Until then the game waits.",
        ],
      },
      {
        heading: "While you play",
        body: [
          "The play and pause button controls the music.",
          "Repeat line plays the current snippet again, as often as you need.",
          "Hint reveals part of the word when you get stuck.",
          "Change song goes back to the start to pick another one.",
        ],
      },
      {
        heading: "A tip",
        body: "A song you already know helps at first: you have the melody in your head, which leaves your attention free for the words.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Training your ear with music",
        text: "The song plays and you fill in the lyrics. It is the exercise closest to hearing the language in real life.",
      },
      {
        id: "search",
        target: "immersion-lyrics.search",
        title: "Picking the song",
        text: "Search by song title or artist and confirm it in the fields below. Start with something you already know: with the melody in your head, your attention is free for the words.",
      },
      {
        id: "pause-every",
        target: "immersion-lyrics.search",
        title: "Pause every",
        text: "Choose whether the song stops every 1 line or every 2 lines. Start with 1 line: it gives you more time to listen and type. Then tap Start.",
      },
      {
        id: "game",
        target: "immersion-lyrics.game",
        title: "Filling in the lyrics",
        text: "Type the missing words as the song moves along. Repeat line plays the snippet again, Hint reveals part of the word and Change song takes you back to the start.",
      },
    ],
  },

  "/hub/student/immersion/word-ladder": {
    title: "Word Ladder",
    summary:
      "Turn one word into another by changing a single letter at a time, always forming real words.",
    docsArticleId: "aluno-imersao",
    sections: [
      {
        heading: "How to play",
        body: "You get a starting word and a target word. Each step changes exactly one letter, and the result has to be a word that exists. The game tells you when a step is not valid.",
      },
      {
        heading: "The controls",
        body: [
          "The on-screen keyboard works alongside your device keyboard.",
          "Undo steps back one move.",
          "The options button adjusts the difficulty and what the game shows.",
          "The language selector picks which language you play in.",
          "Tap any word along the path to see its meaning and pronunciation.",
        ],
      },
    ],
    tour: [
      {
        id: "intro",
        title: "One letter at a time",
        text: "Leave the starting word and reach the target by changing one letter per step — and every step has to be a real word.",
      },
      {
        id: "board",
        target: "immersion-word-ladder.board",
        title: "The path",
        text: "Each row is one of your steps. The game tells you when a change does not form a valid word, so you can experiment freely.",
      },
      {
        id: "controls",
        target: "immersion-word-ladder.toolbar",
        title: "Undo, options and language",
        text: "Undo steps back one move. In the options you adjust the difficulty and what shows on screen. The selector switches the game's language.",
      },
      {
        id: "learn",
        title: "Make the vocabulary count",
        text: "Tap any word along the path to see its meaning, pronunciation and an example. That is where the game turns into study.",
      },
    ],
  },

  "/hub/student/recess/[slotId]": {
    title: "Recess Activity",
    summary:
      "The activity that takes the place of your class while your teacher is on recess.",
    sections: [
      {
        heading: "Why this screen exists",
        body: "When your teacher goes on recess, the class for that period does not happen — but your schedule does not stop. This activity takes the place of the class so you keep studying.",
      },
      {
        heading: "How the screen is laid out",
        body: "The lesson content sits on the wider side, for reading. Practise and Test, on the other side, holds the activity's quiz when there is one.",
      },
      {
        heading: "The quiz",
        body: "Answer the questions and, when you finish, the screen shows how many you got right. Try Again restarts the quiz as often as you like — there is no limit and no grade at stake.",
      },
      {
        heading: "No content or no quiz?",
        body: "Some activities have only text, others only a quiz. The screen says so when one of the parts was not set up — it is not something you did wrong.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "An activity in place of your class",
        text: "Your teacher is on recess for this period. This activity keeps your schedule moving until classes resume.",
      },
      {
        id: "content",
        target: "student-recess.content",
        title: "The content",
        text: "The lesson to read, in your own time. If the activity has no text set up, the screen says so here.",
      },
      {
        id: "quiz",
        target: "student-recess.quiz",
        title: "Practise and Test",
        text: "The activity's quiz. When you finish, you see how many you got right, and Try Again restarts it with no limit — nothing here is graded.",
      },
    ],
  },

  "/hub/student/docs": {
    title: "Help Centre",
    summary:
      "The complete platform guide for students, with search and a place to ask questions.",
    sections: [
      {
        heading: "What is here",
        body: "The full guides, organised by subject: getting started, classes and calendar, payments, study and practice, account and settings, and common problems. It is the long version of what the (?) on each page summarises.",
      },
      {
        heading: "Finding what you need",
        body: "Use the search at the top: it looks through the whole text of the articles, not just the titles. It is worth searching for the problem in your own words — for example, my class disappeared or I cannot sign in.",
      },
      {
        heading: "Did not find the answer?",
        body: "You can send your question. It reaches the school, and questions that come up often become new articles here.",
      },
      {
        heading: "Help for the page you are on",
        body: "For a short explanation of the screen you are on, without leaving it, use the (?) at the top of any page.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The complete guide",
        text: "This is the long version of the help. The (?) on each page summarises that screen; the full guides live here.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "The search",
        text: "It looks inside the whole text of the articles, not just the titles. Describe the problem in your own words, like my class disappeared.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "The subjects",
        text: "The guides grouped by theme: getting started, classes and calendar, payments, study, account and common problems.",
      },
      {
        id: "ask",
        target: "docs.ask",
        title: "Asking",
        text: "Did not find it? Send your question. It reaches the school, and what many people ask tends to become an article here.",
      },
    ],
  },
};
