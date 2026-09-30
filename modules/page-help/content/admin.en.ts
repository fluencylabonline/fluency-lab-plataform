import type { AdminHelpRoute, RoleHelpContent } from "../page-help.types";

/**
 * Ajuda das páginas do admin — inglês.
 *
 * Tradução de `admin.pt.ts`: mesmos `id` de passo, mesma quantidade de seções
 * e a mesma ordem.
 */
export const ADMIN_HELP_EN: RoleHelpContent<AdminHelpRoute> = {
  "/hub/admin/profile": {
    title: "My Profile",
    summary: "Your details on the platform and a map of the admin areas.",
    docsArticleId: "config-perfil",
    sections: [
      {
        heading: "What lives here",
        body: "Your public details on the platform: name, photo and contact information.",
      },
      {
        heading: "What is in your menu",
        body: [
          "Dashboard: revenue, students, classes and growth indicators.",
          "Users: the whole base, with each person's full record.",
          "Finance: transactions, taxes, forecasts and plans.",
          "Contracts: templates, signatures and the school's legal data.",
          "Courses: the video course catalogue.",
          "Communication: notifications, WhatsApp templates and email history.",
          "Conversations, Tasks, Procedures and the Help Centre.",
        ],
      },
      {
        heading: "Everything here is restricted",
        body: "Your account reaches personal and financial data across the whole base. Sensitive actions ask for your password again (sudo mode) and are recorded in the audit log — that is traceability, not suspicion.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your home page",
        text: "Your details live here. The work happens in the Dashboard, in Users and in Finance.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Getting around",
        text: "Dashboard, Users, Finance, Contracts, Courses, Communication, Conversations, Tasks, Procedures and the Help Centre.",
      },
      {
        id: "sudo",
        title: "Sudo mode",
        text: "Sensitive actions — confirming a payment by hand, changing an instalment's amount, revealing a tax ID, deactivating a student — ask for your password again and write an audit entry. There is an attempt limit.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "This button is on every page",
        text: "The (?) explains the screen you are on. For the full guides, including what the system does on its own through cron and webhooks, use the Help Centre.",
      },
    ],
  },

  "/hub/admin/dashboard": {
    title: "Dashboard",
    summary:
      "The school's indicators: revenue, expenses, students, classes and onboarding, with a period filter.",
    docsArticleId: "dashboard-visao",
    sections: [
      {
        heading: "The financial numbers",
        body: [
          "Total Revenue and Total Expenses for the filtered period.",
          "Net Profit, with the margin as a percentage.",
          "Receivable is what has not come in yet.",
          "Cash Flow shows revenue and expenses over the last 6 months.",
        ],
      },
      {
        heading: "Pending revenue is not revenue",
        body: "Receivable is a projection: instalments still open. Adding it to cash when making a decision is the most common mistake on this screen.",
      },
      {
        heading: "Class Status",
        body: "The split between Completed, No-show, Cancelled by Student and Cancelled by Teacher. A lot of teacher cancellations usually points to an allocation problem, not a student one.",
      },
      {
        heading: "Onboarding Funnel",
        body: "How many students sit at each stage of the initial process and how many dropped out at each. The stage with the most drop-offs is the current bottleneck.",
      },
      {
        heading: "Featured Courses and PWA Adoption",
        body: "The courses with the most enrolments, and how many users installed the platform as an app.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The school's dashboard",
        text: "Revenue, students, classes and onboarding in one place. Everything respects the period filter.",
      },
      {
        id: "finance",
        target: "admin-dashboard.finance",
        title: "The financial numbers",
        text: "Revenue, expenses, profit with margin and Receivable, plus cash flow over the last 6 months.",
      },
      {
        id: "pending",
        target: "admin-dashboard.finance",
        title: "Receivable is not cash",
        text: "It is a projection — instalments still open. Adding it to cash when deciding something is the most common mistake on this screen.",
      },
      {
        id: "academic",
        target: "admin-dashboard.academic",
        title: "Class Status",
        text: "Completed, No-show, cancelled by student and cancelled by teacher. Lots of teacher cancellations is usually an allocation problem, not a student one.",
      },
      {
        id: "funnel",
        target: "admin-dashboard.funnel",
        title: "Onboarding Funnel",
        text: "How many students sit at each initial stage and how many dropped out at each. The stage with the most drop-offs is the current bottleneck.",
      },
    ],
  },

  "/hub/admin/users": {
    title: "Users",
    summary:
      "The whole base of students, teachers, managers and admins, with search and filters.",
    docsArticleId: "lista-usuarios",
    sections: [
      {
        heading: "The search and the four filters",
        body: [
          "The search finds people by name, email or phone.",
          "Role: All Roles, Administrator, Teacher, Student or Manager. It opens on Student.",
          "Status: All, Active or Inactive. It opens on Active — a closed account only appears once you switch.",
          "Contract: All contracts, Active or No Contract.",
          "Payment: All payments, Paid or Pending.",
        ],
      },
      {
        heading: "Create User",
        body: "The button at the top opens the registration form. On saving, the account is created and the access invitation goes out automatically by email and WhatsApp. The person sets their own password from the link — the school never sets anyone's password.",
      },
      {
        heading: "The invitation expires",
        body: "If the person takes too long, the link stops working. In that case resend the invitation from their record, in the actions tab — there is no need to recreate the account.",
      },
      {
        heading: "Adaptive Profile",
        body: "The button to the right of the filters leads to onboarding: new students' entry profiles and who stalled midway.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The user base",
        text: "Everyone at the school is here: students, teachers, managers and admins.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "The search",
        text: "Finds people by name, email or phone.",
      },
      {
        id: "filters",
        target: "users.filters",
        title: "The four filters",
        text: "Role (opens on Student), Status (opens on Active), Contract and Payment. Status on Active is the trap: a deactivated account disappears from the list and looks like it does not exist.",
      },
      {
        id: "create",
        target: "users.create",
        title: "Create User",
        text: "Creates the account and fires the invitation by email and WhatsApp automatically. The person sets their own password from the invitation link.",
      },
      {
        id: "list",
        target: "users.list",
        title: "The list",
        text: "One card per person, with contract and payment badges visible at a glance. Click to open the full record.",
      },
      {
        id: "onboarding",
        target: "users.onboarding",
        title: "Adaptive Profile",
        text: "New students' entry profiles, showing who has answered and who stopped midway.",
      },
    ],
  },

  "/hub/admin/users/[userId]": {
    title: "User record",
    summary:
      "Everything about one person — and where the platform's irreversible actions live.",
    docsArticleId: "ficha-usuario",
    sections: [
      {
        heading: "The tabs change with the role",
        body: [
          "Profile always appears, with the administrative actions at the end.",
          "For a student: Payment, Contract and Plan, Classes and Curriculum, and Certificate.",
          "For a teacher: Earnings Statement, Contracts, Schedule and Students.",
        ],
      },
      {
        heading: "The buttons on an instalment",
        body: [
          "Generate payment code creates the charge at the gateway: a PIX through AbacatePay in reais, a Stripe checkout link in dollars.",
          "Generate again replaces an expired or cancelled PIX. It only appears on overdue or cancelled instalments, and only on charges in reais.",
          "Resend reminder sends the charge again by email and WhatsApp, with the same code.",
          "Update (new amount) corrects the amount. It requires your password and writes an audit entry with the old and new values.",
          "Confirm and mark as paid records settlement without waiting for the gateway. It requires your password, books the gateway fee as an expense and notifies the student.",
        ],
      },
      {
        heading: "Two billing traps",
        body: "Changed the amount on an instalment that already had a charge generated? Generate the code again — the old PIX still carries the old amount. And only confirm payment by hand for money received outside the platform: a PIX paid on the code generated here is confirmed on its own by the webhook, and confirming on top of it creates a double entry.",
      },
      {
        heading: "Ending an enrolment",
        body: "Deactivating a student genuinely cancels their future classes, ends the subscription and the contract and, outside the last month of the contract, generates a cancellation fee of 50% of one month. It requires your password. There is no undo button.",
      },
      {
        heading: "While the cancellation fee is pending",
        body: "Copy PIX takes the code so you can send it through another channel, Resend Fee fires the charge again, and Confirm and mark as paid completes the cancellation. Careful: the PIX code stays valid at the gateway until it expires — if the student pays after you confirm by hand, the amount is counted twice.",
      },
      {
        heading: "Revealing sensitive data is audited",
        body: "Tax ID, full phone number and address can be revealed by you, with a password. Every reveal is recorded.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The full record",
        text: "Everything about one person, in tabs — and this is where the actions with no undo live.",
      },
      {
        id: "tabs",
        target: "user-details.tabs",
        title: "The tabs",
        text: "Profile always appears. A student has Payment, Contract and Plan, Classes and Curriculum and Certificate. A teacher has Earnings Statement, Contracts, Schedule and Students.",
      },
      {
        id: "payments",
        target: "user-details.tabs",
        title: "The buttons on an instalment",
        text: "Generate code creates the charge; Generate again replaces an expired PIX; Resend reminder resends the same charge; Update corrects the amount with a password and an audit entry; Confirm and mark as paid records settlement.",
      },
      {
        id: "double-charge",
        title: "Watch out for double entries",
        text: "Only confirm payment by hand for money received outside the platform. A PIX paid on the code generated here is confirmed by the webhook on its own. And if you changed the amount, generate the code again: the old PIX keeps the old value.",
      },
      {
        id: "actions",
        target: "user-details.actions",
        title: "The danger zone",
        text: "Resend invitation, deactivate the account and end the enrolment. Deactivating cancels future classes, ends the subscription and contract and generates the 50% fee outside the last month. It asks for your password and has no undo.",
      },
      {
        id: "sensitive",
        title: "Revealing sensitive data is audited",
        text: "Tax ID, phone and address can be revealed by you, with a password. Every reveal is recorded under your name.",
      },
    ],
  },

  "/hub/admin/students/onboarding": {
    title: "Adaptive Profiles",
    summary:
      "New students' entry profiles: who answered, who stalled and each one's diagnosis.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "Why this matters",
        body: "Every new student fills in an entry profile — goals, level, availability and preferences. It is what guides matching them with the right teacher and planning the first classes.",
      },
      {
        heading: "New Profile",
        body: "The button at the top creates a profile from scratch — useful when a student was enrolled without going through the questionnaire.",
      },
      {
        heading: "The menu on each row",
        body: [
          "View opens the teaching diagnosis generated from the answers.",
          "Edit opens the questionnaire to complete or correct it.",
          "Delete removes the profile.",
        ],
      },
      {
        heading: "An incomplete profile is money standing still",
        body: "A student who does not finish their profile is matched in the dark, and reassigning later is costly on both sides. Worth treating the list of incomplete ones as a work queue.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "New student onboarding",
        text: "Every new student fills in an entry profile. It is what guides matching them with the right teacher.",
      },
      {
        id: "new",
        target: "manager-onboarding.new",
        title: "New Profile",
        text: "Creates a profile from scratch — useful when a student was enrolled without going through the questionnaire.",
      },
      {
        id: "list",
        target: "manager-onboarding.list",
        title: "The list",
        text: "One row per student, with the profile's status. View opens the diagnosis, Edit opens the questionnaire, Delete removes it.",
      },
      {
        id: "why",
        title: "Incomplete is money standing still",
        text: "A student without a finished profile is matched in the dark, and reassigning later is costly. Treat the incomplete list as a work queue.",
      },
    ],
  },

  "/hub/admin/students/onboarding/[profileId]": {
    title: "Student questionnaire",
    summary: "The student's entry profile, to fill in or correct.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "What this form is",
        body: "The entry questionnaire answered at enrolment: the goal with the language, previous experience, availability, the level the student assigns to themselves and how much they intend to commit.",
      },
      {
        heading: "When you fill it in for them",
        body: "When the student stalled midway and does not pick it back up. Filling it in during a call is usually faster than chasing by message.",
      },
      {
        heading: "Answer as the student would",
        body: "The answers feed the teaching diagnosis and the teacher match. Guessing a level or a goal to unblock the record ruins exactly what the form exists to produce.",
      },
      {
        heading: "Once it is complete",
        body: "With a complete profile, the teaching diagnosis can be generated and, from it, the study plan.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The entry profile",
        text: "The questionnaire the student answers at enrolment. You can fill it in or correct it.",
      },
      {
        id: "form",
        target: "manager-onboarding.form",
        title: "The questions",
        text: "Goal, previous experience, availability, self-assessed level and commitment. Work through the steps to the end.",
      },
      {
        id: "honesty",
        title: "Answer as the student would",
        text: "The answers feed the diagnosis and the teacher match. Guessing just to unblock the record ruins what the form exists to produce.",
      },
    ],
  },

  "/hub/admin/students/onboarding/[profileId]/view": {
    title: "Teaching Diagnosis",
    summary:
      "The AI-generated report built from the student's profile, and where the study plan comes from.",
    docsArticleId: "onboarding",
    sections: [
      {
        heading: "What the report is",
        body: "An AI reading of the student, cross-referencing the questionnaire answers with the placement result: goal, context, points to watch and suggested directions.",
      },
      {
        heading: "Structural Data",
        body: [
          "Perceived Level is the level the student assigned to themselves — it may not match the placement test, and that gap is information in itself.",
          "Commitment is how much they said they intend to dedicate, from 0 to 10.",
        ],
      },
      {
        heading: "Plan Generation",
        body: "From the diagnosis, this screen generates the study plan. The Creative AI switch lets the AI suggest topics when it finds no equivalent material in the bank — turn it on for unusual profiles, leave it off when you want the plan tied to reviewed material.",
      },
      {
        heading: "Who else reads this",
        body: "The student's teacher sees this same report, in read-only mode. Check it makes sense before calling the onboarding done.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The student's diagnosis",
        text: "A teaching report generated by AI from the questionnaire and the placement test. This is where the study plan comes from.",
      },
      {
        id: "report",
        target: "teacher-student-profile.report",
        title: "Teaching Report",
        text: "The AI's reading of the student: goal, context, points to watch and suggestions. At the foot are the reference and the date it was last updated.",
      },
      {
        id: "metrics",
        target: "teacher-student-profile.metrics",
        title: "Structural Data",
        text: "Perceived Level is what the student assigned to themselves, and may differ from the placement test — the gap is information. Commitment runs from 0 to 10.",
      },
      {
        id: "plan",
        target: "manager-diagnosis.plan",
        title: "Plan Generation",
        text: "Generates the plan from the diagnosis. The Creative AI switch lets the AI suggest topics when equivalent material is missing: turn it on for unusual profiles, leave it off to tie the plan to reviewed material.",
      },
    ],
  },

  "/hub/admin/finances": {
    title: "Finance",
    summary:
      "Transactions, metrics, gateway balances, estimated tax and the MEI capacity gauge.",
    docsArticleId: "financeiro-painel",
    sections: [
      {
        heading: "The actions menu and the new transaction button",
        body: [
          "The actions menu (the three-dot button) gathers four items.",
          "Tax Configuration opens the tax tables used in the income tax calculation — this is where you update the rates when the new yearly table is published.",
          "Export generates a file with the transactions in the filtered period, for accounting or a spreadsheet.",
          "Forecast opens the detailed projection: which students and which bills make up the projected figures.",
          "Plans opens subscription plan management.",
          "New Transaction manually records a revenue or an expense — rent, marketing, one-off income.",
        ],
      },
      {
        heading: "New Transaction, field by field",
        body: [
          "Type: Revenue or Expense.",
          "Status: Paid, Pending or Cancelled.",
          "Description, Amount and Date.",
          "Category lets you search an existing one or create it on the spot.",
          "Payment Method and Attachment, to keep the receipt with the record.",
        ],
      },
      {
        heading: "Teacher payouts book themselves",
        body: "The teachers' payout becomes an expense automatically from the recorded classes. Entering it by hand as a New Transaction doubles the figure in the result.",
      },
      {
        heading: "MEI capacity gauge",
        body: "It shows how much of the annual MEI ceiling the year's revenue has already consumed. It exists so you can anticipate a change of tax regime before going over, not after.",
      },
      {
        heading: "Export",
        body: "You choose Whole Year or Custom Period, the reference year or the dates, and the transaction source. The file comes out with whatever is filtered.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The finance dashboard",
        text: "Transactions, metrics, gateway balances and the tax calculation. Everything respects the filters in the top bar.",
      },
      {
        id: "actions",
        target: "admin-finances.actions",
        title: "The actions menu",
        text: "The three-dot button gathers Tax Configuration (tax tables), Export (a file for the period), Forecast (the projection item by item) and Plans. Beside it, New Transaction records a manual revenue or expense.",
      },
      {
        id: "transactions",
        target: "admin-finances.table",
        title: "The transactions",
        text: "The list for the filtered period. Click a row to edit it or attach a receipt.",
      },
      {
        id: "auto",
        title: "Teacher payouts book themselves",
        text: "The teachers' payout becomes an expense automatically from the recorded classes. Entering it by hand doubles the figure in the result.",
      },
      {
        id: "mei",
        target: "admin-finances.fiscal",
        title: "Tax and MEI capacity",
        text: "The estimated income tax uses the tables from Tax Configuration, which change yearly. The MEI gauge shows how much of the annual ceiling has been consumed — so you can anticipate a regime change rather than discover it late.",
      },
    ],
  },

  "/hub/admin/finances/forecast": {
    title: "Forecast",
    summary:
      "What should still come in and go out in the period, item by item, with names and due dates.",
    docsArticleId: "financeiro-previsoes",
    sections: [
      {
        heading: "Projected Revenue",
        body: "The period's pending instalments, one row each: student, plan, due date, amount and which instalment it is. It is the breakdown of the Receivable figure on the dashboard.",
      },
      {
        heading: "Pending Expenses",
        body: "The period's unpaid bills, in the same format.",
      },
      {
        heading: "A projection is not cash",
        body: "Everything here is what should happen if everyone pays on time. Treating these figures as available is the mistake that breaks cash flow.",
      },
      {
        heading: "What it is for in practice",
        body: "Seeing name by name who makes up the projected figure. It is the list the month's collections work comes from.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The detailed projection",
        text: "What should still come in and go out in the period, item by item — the breakdown of the dashboard's Receivable.",
      },
      {
        id: "revenue",
        target: "admin-forecast.revenue",
        title: "Projected Revenue",
        text: "One row per pending instalment, with student, plan, due date, amount and instalment number. This is where the month's collections list comes from.",
      },
      {
        id: "expenses",
        target: "admin-forecast.expenses",
        title: "Pending Expenses",
        text: "The period's unpaid bills, in the same format.",
      },
      {
        id: "warning",
        title: "A projection is not cash",
        text: "These figures assume everyone pays on time. Treating them as available is the mistake that breaks cash flow.",
      },
    ],
  },

  "/hub/admin/finances/plans": {
    title: "Plans",
    summary: "The subscription plans sold to students: create, edit, activate and delete.",
    docsArticleId: "financeiro-planos",
    sections: [
      {
        heading: "A plan's fields",
        body: [
          "Plan Name is how it appears at enrolment.",
          "Language sets the plan's language.",
          "Classes per Week and Duration (Months) make up its structure.",
          "Monthly Fee is the amount charged.",
          "Description is optional.",
        ],
      },
      {
        heading: "The buttons",
        body: [
          "New plan creates one. Plans in reais are mirrored as a product in AbacatePay; in dollars, they use Stripe.",
          "The pencil edits name, price and settings.",
          "Activate / Deactivate controls whether the plan shows up as an option for new enrolments.",
          "The bin deletes the plan permanently.",
        ],
      },
      {
        heading: "Changing the price does not change existing subscribers",
        body: "Instalments already generated keep the old amount, and existing students stay on the price they signed up for until you change their plan individually. Editing a plan only affects new enrolments.",
      },
      {
        heading: "Deactivate rather than delete",
        body: "Deletion only works if no student is linked to the plan — with an enrolment attached, the system refuses. To take a plan out of circulation without touching existing subscribers, deactivate it.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The plans you sell",
        text: "The plans that show up at enrolment. Plans in reais go to AbacatePay; in dollars, to Stripe.",
      },
      {
        id: "new",
        target: "admin-plans.new",
        title: "New plan",
        text: "Name, language, classes per week, duration in months and monthly fee. On saving, the plan is mirrored as a product at the matching gateway.",
      },
      {
        id: "list",
        target: "admin-plans.list",
        title: "The plans",
        text: "The pencil edits, the switch activates or deactivates and the bin deletes. Deactivating takes the plan off the shelf without affecting existing subscribers.",
      },
      {
        id: "price",
        title: "Changing the price does not change existing subscribers",
        text: "Generated instalments keep the old amount, and existing students stay on their contracted price until you change their plan one by one. Editing only affects new enrolments.",
      },
      {
        id: "delete",
        title: "Prefer deactivating",
        text: "Deleting only works with no student linked; with an enrolment attached, the system refuses. That is protection, not an error.",
      },
    ],
  },

  "/hub/admin/contracts": {
    title: "Contracts",
    summary:
      "The contract templates, the signatures generated and the school's legal data.",
    docsArticleId: "contratos-modelos",
    sections: [
      {
        heading: "Available Templates",
        body: "The table of templates, with name, region, recipient, signature type, version and status. Only one template is Active per combination of recipient and region.",
      },
      {
        heading: "The template buttons",
        body: [
          "Create Template publishes a new one. For the same recipient and region combination, the new one becomes active and the previous ones are deactivated automatically.",
          "Create New Version duplicates the open template already filled in, for you to edit and save as the next version. It preserves history: contracts already signed keep pointing at the version in force at the time.",
          "Preview Template opens the preview.",
          "Activate makes that template the one in force for its combination.",
          "Delete only works if the template is not active and has no signature attached — protection against losing a legal record.",
        ],
      },
      {
        heading: "Generated and Signed Contracts",
        body: "The other table lists the signatures, with user, template, status (Signed, Pending, Cancelled, Expired) and the generation and signature dates.",
      },
      {
        heading: "The signature buttons",
        body: [
          "Download PDF opens the signed document in a new tab. The link is temporary and lasts one hour — that is what keeps the document off the public internet.",
          "Resend Contract sends the email with the contract attached again.",
          "Verify Signature checks the document's validity.",
        ],
      },
      {
        heading: "Fixing the school's data does not fix the past",
        body: "The legal information is baked into each contract at the moment it is generated. Correcting a detail here applies to future ones — the already signed keep the old text.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The school's contracts",
        text: "Two tables: the templates and the signatures already generated. Plus the legal data that goes into every contract.",
      },
      {
        id: "templates",
        target: "admin-contracts.templates",
        title: "Available Templates",
        text: "One Active template per recipient and region combination. Creating a template for the same combination deactivates the previous ones automatically.",
      },
      {
        id: "version",
        target: "admin-contracts.templates",
        title: "Create New Version",
        text: "Duplicates the template already filled in for you to edit and save as the next version. It preserves history: a signed contract keeps pointing at the version in force at the time.",
      },
      {
        id: "instances",
        target: "admin-contracts.instances",
        title: "Generated and Signed Contracts",
        text: "User, template, status and dates. Download PDF creates a temporary one-hour link; Resend Contract sends the email again.",
      },
      {
        id: "school",
        title: "Fixing the school's data does not fix the past",
        text: "Legal data is baked into a contract when it is generated. A correction now applies to future ones; signed contracts keep the old text.",
      },
    ],
  },

  "/hub/admin/courses": {
    title: "Courses",
    summary: "The video course catalogue: create, publish and control what students see.",
    docsArticleId: "cursos-catalogo",
    sections: [
      {
        heading: "Create course",
        body: "The form asks for a title, description, language and cover image. The course starts as a draft — invisible to students until you publish it.",
      },
      {
        heading: "The menu on each course",
        body: [
          "Edit adjusts the details and the cover.",
          "Publish / Unpublish controls visibility to students. Unpublishing hides it from the shelf but keeps the progress of anyone already taking it.",
          "Delete removes the course and all its content.",
        ],
      },
      {
        heading: "Deleting is destructive",
        body: "Sections, lessons and students' progress go with it and do not come back. If the intention is just to take it off the air, use Unpublish.",
      },
      {
        heading: "Publish only when it is ready",
        body: "A half-finished published course appears on the student's shelf as though it were complete. Leave it as a draft until the content is done.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The course catalogue",
        text: "The school's video courses. Every course starts as a draft, invisible to students.",
      },
      {
        id: "create",
        target: "admin-courses.create",
        title: "Create course",
        text: "Title, description, language and cover image. It starts as a draft — publishing is a separate, deliberate step.",
      },
      {
        id: "list",
        target: "admin-courses.list",
        title: "The courses",
        text: "Each card's menu has Edit, Publish / Unpublish and Delete. Unpublishing hides it from the shelf but preserves the progress of anyone already taking it.",
      },
      {
        id: "delete",
        title: "Deleting is destructive",
        text: "Sections, lessons and students' progress go with it and do not come back. To just take it off the air, use Unpublish.",
      },
    ],
  },

  "/hub/admin/courses/[id]": {
    title: "Course content",
    summary: "A course's sections and lessons, in the order the student will work through them.",
    docsArticleId: "cursos-conteudo",
    sections: [
      {
        heading: "How a course is built",
        body: "A course has sections, and each section has lessons. You create the sections in content order and add lessons inside each one.",
      },
      {
        heading: "The buttons",
        body: [
          "New Section creates a grouping, asking for a title.",
          "New Lesson creates a lesson inside the section, asking for a title.",
          "The drag handle reorders sections and lessons.",
          "The eye shows or hides an item.",
          "Edit Content opens the lesson editor.",
        ],
      },
      {
        heading: "The order is what the student sees",
        body: "The sequence you build here is exactly the sequence in the student's player. Worth reviewing the order before publishing.",
      },
      {
        heading: "An empty section",
        body: "A section with no lessons appears to the student as an empty block. Either add the first lesson or remove the section before publishing.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Building the course",
        text: "Sections group lessons. You create the sections in content order and put the lessons inside each one.",
      },
      {
        id: "sections",
        target: "admin-course-detail.sections",
        title: "Sections and lessons",
        text: "New Section creates a grouping; New Lesson creates a lesson inside it. The drag handle reorders and the eye shows or hides an item.",
      },
      {
        id: "edit",
        target: "admin-course-detail.sections",
        title: "Edit Content",
        text: "Opens the lesson editor, where the video and text blocks and the quiz go.",
      },
      {
        id: "order",
        title: "The order is what the student sees",
        text: "The sequence built here is exactly the student's player order. A section with no lessons appears as an empty block — fill it or remove it before publishing.",
      },
    ],
  },

  "/hub/admin/courses/[id]/lessons/[lessonId]": {
    title: "Lesson Editor",
    summary: "The content of a course lesson: video and text blocks, and the assessment.",
    docsArticleId: "cursos-conteudo",
    sections: [
      {
        heading: "The tabs",
        body: [
          "Content is where the video and text blocks go.",
          "Assessment is the quiz the student answers at the end of the lesson.",
          "Preview shows the lesson as the student will see it.",
        ],
      },
      {
        heading: "Content blocks",
        body: [
          "Add Video accepts a YouTube or Google Drive link.",
          "Add Text opens a formatted text editor.",
          "Blocks appear to the student in the order you place them — you can alternate video and text.",
        ],
      },
      {
        heading: "Lesson settings",
        body: "Lesson Title is required. Duration (minutes) is the estimated time shown to the student.",
      },
      {
        heading: "Save Changes",
        body: "The quiz and the content are saved together. Leaving without saving loses everything built since the last save.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The lesson editor",
        text: "This is where the content the student consumes and the end-of-lesson assessment go.",
      },
      {
        id: "tabs",
        target: "admin-lesson-editor.tabs",
        title: "Content, Assessment and Preview",
        text: "Content holds the video and text blocks. Assessment is the end-of-lesson quiz. Preview shows the lesson as the student will see it — worth checking before publishing the course.",
      },
      {
        id: "blocks",
        target: "admin-lesson-editor.blocks",
        title: "Content blocks",
        text: "Add Video accepts a YouTube or Google Drive link; Add Text opens the formatted editor. Blocks appear in the order you place them, and you can alternate.",
      },
      {
        id: "save",
        target: "admin-lesson-editor.save",
        title: "Save Changes",
        text: "Saves content and quiz together. Leaving without saving loses everything built since the last save.",
      },
    ],
  },

  "/hub/admin/my-courses": {
    title: "My Learning",
    summary: "The student's view, for you to take the school's courses yourself.",
    docsArticleId: "meu-aprendizado",
    sections: [
      {
        heading: "What lives here",
        body: "The courses available to your account, exactly as a student sees them. It works the same way: sections, lessons and progress saved automatically.",
      },
      {
        heading: "What it is for in practice",
        body: "It is the most direct way to check how a course turned out before announcing it — seeing it through the student's eyes tends to reveal what the editing screen hides.",
      },
      {
        heading: "This is not the catalogue",
        body: "Creating and publishing courses happens under Courses. Here you only consume them.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The student's view",
        text: "The courses as a student sees them. It is the most direct way to check how a course turned out before announcing it.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "Your courses",
        text: "Each card is a course available to your account, with the progress you have made. Tap it to open.",
      },
      {
        id: "catalog",
        title: "This is not the catalogue",
        text: "Creating, editing and publishing happen under Courses. Here you only consume.",
      },
    ],
  },

  "/hub/admin/my-courses/[id]": {
    title: "Watching the course",
    summary: "The course player, exactly as the student sees it.",
    docsArticleId: "meu-aprendizado",
    sections: [
      {
        heading: "How the screen is laid out",
        body: "The lesson content sits in the middle and the lesson list in the side menu, grouped by section. Completed ones appear ticked. On a phone, use the Menu button to open and close the list.",
      },
      {
        heading: "The buttons",
        body: [
          "Mark as completed records the lesson as done and updates the progress bar.",
          "Previous and Next move between lessons in course order.",
          "Menu opens the lesson list on a phone.",
        ],
      },
      {
        heading: "This is where mistakes show up",
        body: "A video that will not load, a text block out of order, a quiz with the wrong answer marked — all of that jumps out on this screen and not on the editing one. Worth walking through a new course end to end before publishing.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The course player",
        text: "The exact student experience. It is where build mistakes show up.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "The lesson",
        text: "Video, text or both. When a lesson has no content published, the screen says so — and the student sees that same notice.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "The course lessons",
        text: "The full list, by section, with completed ones ticked. It is the order you built on the course content screen.",
      },
      {
        id: "review",
        title: "Walk through it before publishing",
        text: "A video that will not load, text out of order, a quiz with the wrong answer marked — all of that jumps out here and not on the editing screen.",
      },
    ],
  },

  "/hub/admin/tasks": {
    title: "Tasks",
    summary: "The team's task and project manager, as a list or a kanban board.",
    docsArticleId: "tarefas",
    sections: [
      {
        heading: "Projects and the inbox",
        body: "The side menu lists the projects. Each project has its own set of status columns. Tasks with no project go to the inbox.",
      },
      {
        heading: "The two views",
        body: [
          "List shows tasks in sequence — good for scanning what is outstanding.",
          "Kanban shows the status columns side by side — good for seeing where work has stalled.",
        ],
      },
      {
        heading: "Creating a task",
        body: [
          "Title and Description say what needs doing.",
          "Project and Column decide where it starts; with no project, it goes to the inbox.",
          "Due Date is the deadline.",
          "Assignees puts the task on specific people.",
          "Recurring Task recreates it automatically each cycle.",
        ],
      },
      {
        heading: "Where recurring helps",
        body: "Admin routines that repeat — checking overdue instalments, updating the tax table at the start of the year, reviewing stalled onboarding profiles — are exactly the use case for a recurring task.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The team's tasks",
        text: "Organises the work into projects, each with its own status flow.",
      },
      {
        id: "projects",
        target: "tasks.projects",
        title: "Projects",
        text: "The side menu lists the projects. A task with no project sits in the inbox. Since each project has its own columns, worth splitting fronts.",
      },
      {
        id: "views",
        target: "tasks.views",
        title: "List and Kanban",
        text: "List is better for scanning what is outstanding; Kanban, for seeing where it stalled. On a phone, the button beside the + switches between them.",
      },
      {
        id: "new",
        target: "tasks.new",
        title: "New task",
        text: "Title, description, project and column, deadline and assignees. The Recurring Task switch is for admin routines: checking overdue instalments, updating the tax table, reviewing stalled onboardings.",
      },
    ],
  },

  "/hub/admin/procedures": {
    title: "Procedures",
    summary: "The base of standard operating procedures (SOPs) written by the team.",
    docsArticleId: "procedimentos",
    sections: [
      {
        heading: "What an SOP is",
        body: "A standard operating procedure: the step-by-step of how the school does something. It is what lets someone else carry out the task the same way.",
      },
      {
        heading: "The buttons",
        body: [
          "New SOP creates a procedure, asking for a title and opening the formatted text editor.",
          "Search procedures filters the list by title.",
          "The bin deletes — and there is no undo.",
        ],
      },
      {
        heading: "What makes a good SOP",
        body: "The routines only one person currently knows how to do: how to complete an enrolment, what to check before confirming a payment by hand, how to handle a cancellation request. If someone has asked twice, it becomes an SOP.",
      },
      {
        heading: "Deletion is permanent",
        body: "The content is lost, with no bin and no recovery. When in doubt, empty the text and keep the record rather than deleting it.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The school's procedures",
        text: "The SOP base: the step-by-step of how the school does each thing, written by the team itself.",
      },
      {
        id: "new",
        target: "admin-procedures.new",
        title: "New SOP",
        text: "Asks for a title and opens the formatted text editor. Good rule: if someone has asked the same thing twice, it becomes an SOP.",
      },
      {
        id: "search",
        target: "admin-procedures.search",
        title: "Search procedures",
        text: "Filters the list by title. Worth naming SOPs after the question they answer.",
      },
      {
        id: "delete",
        title: "Deletion is permanent",
        text: "The bin deletes with no undo and no recovery. When in doubt, empty the text and keep the record.",
      },
    ],
  },

  "/hub/admin/procedures/[id]": {
    title: "Procedure",
    summary: "An SOP's content, to read or edit.",
    docsArticleId: "procedimentos",
    sections: [
      {
        heading: "Reading and editing",
        body: "The screen opens in reading mode. The edit button unlocks the text, and save writes over the previous version.",
      },
      {
        heading: "The editor",
        body: "It accepts formatted text: headings, lists, bold and links. Numbered steps work better than running prose for whoever has to carry it out.",
      },
      {
        heading: "There is no version history",
        body: "Saving replaces the previous content without keeping what was there. Before a large rewrite, copy the current text somewhere.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The procedure",
        text: "The screen opens in reading mode. Edit unlocks the text and save writes over it.",
      },
      {
        id: "editor",
        target: "admin-procedure.editor",
        title: "The editor",
        text: "It accepts headings, lists, bold and links. Numbered steps work better than running prose for whoever has to carry it out.",
      },
      {
        id: "versions",
        title: "There is no version history",
        text: "Saving replaces the previous content without keeping the old one. Before a large rewrite, copy the current text somewhere.",
      },
    ],
  },

  "/hub/admin/communication": {
    title: "Communication",
    summary:
      "Notifications to the base, WhatsApp templates and the history of emails sent.",
    docsArticleId: "comunicacao-notificacoes",
    sections: [
      {
        heading: "Sending a notification",
        body: [
          "Title and Message make up the alert.",
          "Audience chooses between the whole base or specific people, searched by name.",
          "It goes out as a push and as an in-platform notification.",
        ],
      },
      {
        heading: "There is no unsend",
        body: "A notification that has been fired reaches people's devices immediately. There is no cancelling and no editing afterwards. Check the text and the audience before confirming.",
      },
      {
        heading: "WhatsApp templates",
        body: [
          "Create template submits a new one for Meta's approval. It starts as pending and can take hours to be approved or rejected.",
          "Refresh templates pulls the latest status of each one from Meta.",
          "Send message fires an approved template to a student.",
          "Delete removes the template from the account.",
        ],
      },
      {
        heading: "Careful when deleting a template",
        body: "Templates used by automated routines — payment reminders, welcome messages — should not be deleted: the automatic alerts stop going out, and that only surfaces days later.",
      },
      {
        heading: "Email history",
        body: "Lists what was sent, with date and content. It is where you check whether an email actually went out when a student says they did not receive it.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Communicating with the base",
        text: "Push notifications, WhatsApp templates and the email history, all on one screen.",
      },
      {
        id: "notify",
        target: "admin-communication.notify",
        title: "Sending a notification",
        text: "Title, message and audience — the whole base or specific people. It goes out as a push and as an in-platform notification.",
      },
      {
        id: "no-undo",
        title: "There is no unsend",
        text: "A fired notification reaches people's devices immediately, with no cancelling and no editing. Check the text and the audience before confirming.",
      },
      {
        id: "templates",
        target: "admin-communication.templates",
        title: "WhatsApp templates",
        text: "Create template submits to Meta, which takes hours to approve. Refresh templates pulls the latest status. Send message fires an approved one.",
      },
      {
        id: "template-warning",
        title: "Careful when deleting a template",
        text: "The ones used by automated routines — payment reminders, welcome messages — make the automatic alerts stop going out, and that only surfaces days later.",
      },
      {
        id: "emails",
        target: "admin-communication.emails",
        title: "Email history",
        text: "What was sent, with date and content. This is where you check when a student says they did not receive it.",
      },
    ],
  },

  "/hub/admin/conversas": {
    title: "Conversations",
    summary:
      "The inbox for the school's official WhatsApp, to talk directly with students.",
    docsArticleId: "conversas",
    sections: [
      {
        heading: "How it works",
        body: "Students' messages arrive here in real time, and your reply goes out from the school's official number. The list on the left holds the conversations; the search above it finds a conversation or a shortcut.",
      },
      {
        heading: "The 24-hour window",
        body: "You can write freely while you are within 24 hours of the student's last message. After that, you can only start contact with an approved template. That is a Meta rule, not a platform one.",
      },
      {
        heading: "The buttons in a conversation",
        body: [
          "The + at the top of the list starts a new conversation from a template — the route for someone outside the 24-hour window.",
          "The paperclip sends a photo, audio or document.",
          "Typing / in the message field opens the quick replies.",
          "Tapping the contact's name opens their details and labels.",
        ],
      },
      {
        heading: "Templates live under Communication",
        body: "Creating and submitting a new template to Meta happens on the Communication screen. Here you only use the approved ones.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The school's WhatsApp",
        text: "Students' messages arrive here, and your reply goes out from the official number.",
      },
      {
        id: "list",
        target: "conversas.list",
        title: "The conversations",
        text: "The list on the left, with the search above it — which finds both conversations and quick-reply shortcuts.",
      },
      {
        id: "new",
        target: "conversas.new",
        title: "New conversation from a template",
        text: "The route to reaching someone outside the 24-hour window. Outside it, only an approved template goes out.",
      },
      {
        id: "window",
        title: "The 24-hour window",
        text: "Within 24 hours of the student's last message you can write freely. After that, only an approved template — a Meta rule, not a platform one.",
      },
      {
        id: "quick",
        target: "conversas.composer",
        title: "Quick replies",
        text: "Type / in the message field to open the prewritten shortcuts. The paperclip beside it sends a photo, audio or document.",
      },
    ],
  },

  "/hub/admin/settings": {
    panel: "wizard",
    title: "Settings",
    summary:
      "Your account, its security and the platform's global configuration.",
    docsArticleId: "config-conta",
    tour: [
      {
        id: "intro",
        title: "The settings",
        text: "The five tabs everyone has, plus two only the admin sees: Platform and WhatsApp.",
      },
      {
        id: "tabs",
        target: "settings.tabs",
        title: "The tabs",
        text: "Account, Appearance, Notifications, Security and App appear for everyone. Platform and WhatsApp are admin-only and change global configuration.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Security tab — turn on 2FA",
        text: "Your account reaches personal and financial data across the whole base, and performs irreversible actions. Two-step verification is the most effective protection against unauthorised access.",
      },
      {
        id: "platform",
        target: "settings.tabs",
        title: "Platform tab",
        text: "Global settings such as the support email and the school's contact number. Changes here apply to every user — check before saving.",
      },
      {
        id: "whatsapp",
        target: "settings.tabs",
        title: "WhatsApp tab",
        text: "The integration with the school's WhatsApp. It is what makes the Conversations screen and the automated alerts work.",
      },
    ],
  },

  "/hub/admin/docs": {
    title: "Help Centre",
    summary:
      "The complete platform guide for admins, including what the system does on its own.",
    sections: [
      {
        heading: "What is here",
        body: "The full guides, by subject: getting started, dashboard, users, finance, contracts, courses, communication, internal operations, settings and troubleshooting.",
      },
      {
        heading: "Two reads that save time",
        body: [
          "What the system does on its own: the scheduled routines (cron) and the webhooks that run without anyone clicking. Knowing this avoids entering by hand what already books itself.",
          "Sudo mode: which actions ask for your password again, and why — including the attempt limit.",
        ],
      },
      {
        heading: "Troubleshooting",
        body: "The four most frequent cases: a student paid and it is still pending, a user cannot sign in, a PIX expired or will not open, and a student says they did not receive the alert.",
      },
      {
        heading: "Questions to the AI",
        body: "What users ask the Help Centre assistant is recorded. The Questions screen shows what the documentation could not answer — it is the list of what is missing.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The complete guide",
        text: "The long version of the admin help, including what the system runs on its own through cron and webhooks.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "The search",
        text: "It looks through the whole text of the articles. Search by the symptom, like the PIX expired.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "The subjects",
        text: "Getting started, dashboard, users, finance, contracts, courses, communication, operations and troubleshooting. Worth reading Getting Started end to end once.",
      },
      {
        id: "ask",
        target: "docs.ask",
        title: "Asking",
        text: "Questions asked here are recorded. The Questions screen shows what went unanswered — it is the list of what still needs documenting.",
      },
    ],
  },

  "/hub/admin/docs/questions": {
    title: "Questions to the AI",
    summary:
      "What users asked the Help Centre assistant — and what went unanswered.",
    sections: [
      {
        heading: "The three numbers at the top",
        body: [
          "Questions asked: the total for the period.",
          "Unanswered by the docs: how many the AI could not answer with the existing material.",
          "Marked as bad: how many got a thumbs down from the person asking.",
        ],
      },
      {
        heading: "What this screen is for",
        body: "It is the agenda of what still needs documenting. Every unanswered question is a hole in the Help Centre that someone already tried to fill on their own and could not.",
      },
      {
        heading: "How to use it in practice",
        body: "Start with the unanswered ones, then the ones marked as bad — those usually point to an article that exists but is confusing, rather than missing content.",
      },
      {
        heading: "Where the content is written",
        body: "Help Centre articles live in the code, under modules/docs. The short help behind each page's (?) lives under modules/page-help. A recurring question usually deserves both.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "What people ask",
        text: "The questions put to the Help Centre assistant, and which of them went unanswered.",
      },
      {
        id: "stats",
        target: "admin-questions.stats",
        title: "The three numbers",
        text: "Questions asked in the period, how many the documentation could not answer and how many were marked as bad by the person asking.",
      },
      {
        id: "list",
        target: "admin-questions.list",
        title: "The questions",
        text: "Each row is a real question. Start with the unanswered ones: they are holes someone already tried to fill on their own and could not.",
      },
      {
        id: "bad",
        title: "Marked as bad is a different signal",
        text: "It usually points to an article that exists but is confusing, not missing content. The fix is rewriting, not writing anew.",
      },
    ],
  },
};
