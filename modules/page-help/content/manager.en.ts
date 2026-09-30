import type { ManagerHelpRoute, RoleHelpContent } from "../page-help.types";

/**
 * Ajuda das páginas do manager — inglês.
 *
 * Tradução de `manager.pt.ts`: mesmos `id` de passo, mesma quantidade de seções
 * e a mesma ordem.
 */
export const MANAGER_HELP_EN: RoleHelpContent<ManagerHelpRoute> = {
  "/hub/manager/profile": {
    title: "My Profile",
    summary: "Your registration details and a map of the areas you look after.",
    docsArticleId: "mgr-papel",
    sections: [
      {
        heading: "What lives here",
        body: "Your registration details and preferences. This is the screen that opens when you sign in.",
      },
      {
        heading: "What you can do",
        body: [
          "Student support: open any student's record, see their history and resolve day-to-day issues.",
          "Teacher support: follow schedules and help with class adjustments.",
          "Credits: grant make-up credits when the situation warrants it.",
          "Teaching material: create, edit and publish lessons, learning items and the placement test.",
          "Classes: adjust the status of any class when a teacher cannot.",
          "Conversations: support students through the school's WhatsApp.",
        ],
      },
      {
        heading: "What stays with the admin",
        body: [
          "Creating and deactivating users.",
          "Full finance: transactions, taxes, plans and payment confirmation.",
          "Contracts: templates and the school's legal data.",
          "Revealing sensitive data: tax ID, phone number and address.",
        ],
      },
      {
        heading: "Need something out of your reach?",
        body: "It is not a matter of trust — it is separation of responsibility. Those actions require password confirmation and are recorded in the audit log. Pass them to the admin.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your home page",
        text: "Your details live here. The day-to-day work happens in Users, Conversations and Learning.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Getting around",
        text: "Users (records and support), Conversations (the school's WhatsApp), Learning (teaching material), Tasks, My Learning and Settings.",
      },
      {
        id: "limits",
        title: "What stays with the admin",
        text: "Creating and deactivating users, full finance, contracts and revealing tax ID, phone or address. Those require a password and are audited — pass them on rather than promising the student.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "This button is on every page",
        text: "The (?) explains the screen you are on. For the full guides and the support playbooks, use the Help Centre in the menu.",
      },
    ],
  },

  "/hub/manager/users": {
    title: "Users",
    summary:
      "The search and the record for students and teachers — the starting point of almost every support case.",
    docsArticleId: "mgr-ficha-aluno",
    sections: [
      {
        heading: "The search",
        body: "The search at the top finds people by name, email or phone. Click a card to open that person's full record.",
      },
      {
        heading: "The four filters",
        body: [
          "Role: All Roles, Administrator, Teacher, Student or Manager. It opens on Student.",
          "Status: All, Active or Inactive. It opens on Active — which is why a closed account does not show up until you switch to All or Inactive.",
          "Contract: All contracts, Active or No Contract. Useful for finding who has not signed yet.",
          "Payment: All payments, Paid or Pending. Useful for the collections list.",
        ],
      },
      {
        heading: "When someone says they cannot sign in",
        body: "The first step is almost always the Status filter: it opens on Active, so a deactivated account disappears from the list and looks like it does not exist. Switch to Inactive before concluding anything.",
      },
      {
        heading: "Adaptive Profile",
        body: "The button to the right of the filters leads to onboarding: the list of new students' entry profiles, showing who has answered and who stalled midway.",
      },
      {
        heading: "Masked fields",
        body: "Tax ID, full phone number and address appear hidden, and only the admin can reveal them. If a case requires confirming a document, pass it on.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The starting point for support",
        text: "Almost every support case starts here: find the person and open their record.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "The search",
        text: "Finds people by name, email or phone. It is the fastest route once the student has identified themselves.",
      },
      {
        id: "filters",
        target: "users.filters",
        title: "The four filters",
        text: "Role (opens on Student), Status (opens on Active), Contract (Active or No Contract) and Payment (Paid or Pending). Combining Contract with Payment builds the day's list of loose ends.",
      },
      {
        id: "status-trap",
        target: "users.filters",
        title: "The Status trap",
        text: "It opens on Active. A student who says they cannot sign in and is missing from the search may simply be deactivated — switch to Inactive before concluding anything.",
      },
      {
        id: "list",
        target: "users.list",
        title: "The list",
        text: "One card per person, with contract and payment status visible at a glance. Click to open the full record.",
      },
      {
        id: "onboarding",
        target: "users.onboarding",
        title: "Adaptive Profile",
        text: "Leads to the list of new students' entry profiles. An incomplete profile is worth chasing: the sooner it is finished, the better the match with the right teacher.",
      },
    ],
  },

  "/hub/manager/users/[userId]": {
    title: "User record",
    summary:
      "The full picture of one person: details, payments, contract, classes and curriculum.",
    docsArticleId: "mgr-ficha-aluno",
    sections: [
      {
        heading: "The tabs change with the role",
        body: [
          "Profile always appears: contact details and registration information.",
          "For a student: Payment, Contract and Plan, Classes and Curriculum, and Certificate.",
          "For a teacher: Earnings Statement, Contracts, Schedule and Students.",
        ],
      },
      {
        heading: "What you resolve from here",
        body: [
          "Grant a make-up credit from the classes and curriculum tab.",
          "Adjust a class's status when the teacher cannot.",
          "Check contract and payment status before replying to the student.",
        ],
      },
      {
        heading: "The kinds of credit",
        body: [
          "Teacher cancellation: created automatically. Nothing for you to do.",
          "School delay: for when something on our side spoiled the class.",
          "Bonus: a courtesy or an agreed compensation. Use it with judgement and record the reason in the case notes.",
        ],
      },
      {
        heading: "Two traps with credits",
        body: "Every credit has an expiry date: set a realistic one and tell the student, because an expired credit disappears and turns into a complaint. And if the student books the make-up with a credit and then cancels that class, the credit is consumed anyway — make that clear before they confirm the slot.",
      },
      {
        heading: "What you cannot see or do here",
        body: "Tax ID, full phone number and address stay masked. Deactivating the account, confirming a payment manually and executing an enrolment cancellation are admin actions, with a password and an audit trail.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The full record",
        text: "Everything about one person, in tabs. Which tabs appear depends on their role.",
      },
      {
        id: "tabs",
        target: "user-details.tabs",
        title: "The tabs",
        text: "Profile always appears. A student has Payment, Contract and Plan, Classes and Curriculum and Certificate. A teacher has Earnings Statement, Contracts, Schedule and Students.",
      },
      {
        id: "credits",
        target: "user-details.tabs",
        title: "Granting a credit",
        text: "From the classes and curriculum tab. Pick the right kind: teacher cancellation is already automatic; school delay is for a failure on our side; bonus is a courtesy, and deserves a recorded reason.",
      },
      {
        id: "credit-traps",
        title: "Two traps with credits",
        text: "A credit has an expiry date and disappears when it passes — set a realistic one and tell the student. And a make-up booked with a credit that the student later cancels consumes the credit anyway. Say so before they confirm.",
      },
      {
        id: "masked",
        title: "What stays with the admin",
        text: "Tax ID, full phone and address appear masked. Deactivating an account, confirming a payment by hand and executing an enrolment cancellation are theirs too. Pass those on rather than promising.",
      },
    ],
  },

  "/hub/manager/students/onboarding": {
    title: "Adaptive Profiles",
    summary:
      "New students' entry profiles: who has answered, who stalled, and what each one said.",
    docsArticleId: "mgr-onboarding",
    sections: [
      {
        heading: "Why this matters",
        body: "Every new student fills in an entry profile — goals, level, availability and preferences. That information is what guides matching them with the right teacher and planning the first classes.",
      },
      {
        heading: "What the list shows",
        body: "One row per student, with the profile's status. Incomplete profiles are the ones worth chasing: the student started and stopped.",
      },
      {
        heading: "New Profile",
        body: "The button at the top creates a profile from scratch — useful when a student was enrolled without going through the questionnaire, or when the profile has to be redone.",
      },
      {
        heading: "The menu on each row",
        body: [
          "View opens the teaching diagnosis generated from the answers.",
          "Edit opens the questionnaire, to complete or correct it with the student.",
          "Delete removes the profile.",
        ],
      },
      {
        heading: "The sooner the better",
        body: "A profile finished early means a better match and less risk of switching teachers later — which is costly for the student and for the school.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "New student onboarding",
        text: "Every new student fills in an entry profile. It is what guides matching them with the right teacher.",
      },
      {
        id: "list",
        target: "manager-onboarding.list",
        title: "The list",
        text: "One row per student, with the profile's status. The incomplete ones are worth chasing: the student started and stopped midway.",
      },
      {
        id: "new",
        target: "manager-onboarding.new",
        title: "New Profile",
        text: "Creates a profile from scratch. Useful when a student was enrolled without going through the questionnaire, or when the profile has to be redone.",
      },
      {
        id: "actions",
        target: "manager-onboarding.list",
        title: "The menu on each row",
        text: "View opens the teaching diagnosis generated from the answers. Edit opens the questionnaire, to complete it with the student. Delete removes the profile.",
      },
      {
        id: "why",
        title: "Why chase it",
        text: "A profile finished early means a better match and fewer teacher changes later — the kind of friction that costs everyone.",
      },
    ],
  },

  "/hub/manager/students/onboarding/[profileId]": {
    title: "Student questionnaire",
    summary: "The student's entry profile, to fill in or correct together with them.",
    docsArticleId: "mgr-onboarding",
    sections: [
      {
        heading: "What this form is",
        body: "The entry questionnaire a student answers at enrolment: their goal with the language, previous experience, availability, the level they assign to themselves and how much they intend to commit.",
      },
      {
        heading: "When you fill it in for them",
        body: "When the student stalled midway and does not pick it back up on their own. Filling it in during a call, with them on the line, is usually faster than chasing by message.",
      },
      {
        heading: "Answer as the student would",
        body: "The answers feed the teaching diagnosis and the teacher match. Guessing a level or a goal just to unblock the record ruins exactly what this form exists to produce.",
      },
      {
        heading: "Once it is complete",
        body: "With a complete profile, the coordination team generates the teaching diagnosis and, from it, the study plan.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The entry profile",
        text: "The questionnaire the student answers at enrolment. You can fill it in or correct it with them.",
      },
      {
        id: "form",
        target: "manager-onboarding.form",
        title: "The questions",
        text: "Goal with the language, previous experience, availability, the level they assign to themselves and how much they intend to commit. Work through the steps to the end.",
      },
      {
        id: "honesty",
        title: "Answer as the student would",
        text: "The answers feed the diagnosis and the teacher match. Guessing a level or a goal just to unblock the record ruins exactly what this form exists to produce.",
      },
    ],
  },

  "/hub/manager/students/onboarding/[profileId]/view": {
    title: "Teaching Diagnosis",
    summary:
      "The AI-generated report built from the student's profile, and where the study plan comes from.",
    docsArticleId: "mgr-onboarding",
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
        body: "From the diagnosis, this screen generates the student's study plan. The Creative AI switch lets the AI suggest topics when it finds no equivalent material in the bank — turn it on for unusual profiles, leave it off when you want the plan tied to material that has already been reviewed.",
      },
      {
        heading: "Empty report?",
        body: "If it says the diagnosis is awaiting generation, it has not been generated yet. The questionnaire can be answered without the report existing.",
      },
      {
        heading: "Who else reads this",
        body: "The student's teacher sees this same report, in read-only mode. Worth checking it makes sense before calling the onboarding done.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The student's diagnosis",
        text: "A teaching report generated by AI from the entry questionnaire and the placement test. This is where the study plan comes from.",
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
        text: "Perceived Level is what the student assigned to themselves, and may not match the placement test — the gap is information. Commitment is how much they said they intend to dedicate, from 0 to 10.",
      },
      {
        id: "plan",
        target: "manager-diagnosis.plan",
        title: "Plan Generation",
        text: "Generates the study plan from the diagnosis. The Creative AI switch lets the AI suggest topics when equivalent material is missing from the bank: turn it on for unusual profiles, leave it off to keep the plan tied to reviewed material.",
      },
      {
        id: "audience",
        title: "The teacher reads this too",
        text: "They see the same report, in read-only mode. Check it makes sense before calling the onboarding done.",
      },
    ],
  },

  "/hub/manager/conversas": {
    title: "Conversations",
    summary:
      "The inbox for the school's official WhatsApp, with quick replies and templates.",
    docsArticleId: "mgr-conversas",
    sections: [
      {
        heading: "How it works",
        body: "Students' messages arrive here in real time, and your reply goes out from the school's official number. The list on the left holds the conversations; the search above it finds a conversation or a shortcut.",
      },
      {
        heading: "The 24-hour window",
        body: "You can write freely while you are within 24 hours of the student's last message. After that, you can only start contact with an approved template. That is a Meta rule, not a platform one — pushing at the text field will not help.",
      },
      {
        heading: "The buttons in a conversation",
        body: [
          "The + at the top of the list starts a new conversation from a template — the route to reaching someone outside the 24-hour window.",
          "The paperclip sends a photo, audio or document.",
          "Typing / in the message field opens the quick replies.",
          "Tapping the contact's name opens their details and labels.",
        ],
      },
      {
        heading: "Quick replies",
        body: "They are shortcuts to prewritten text. Type / followed by the shortcut name, like /welcome. They save time and keep the school's tone consistent across the support team.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The school's WhatsApp",
        text: "Students' messages arrive here, and your reply goes out from the school's official number.",
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
        text: "Type / in the message field to open the prewritten shortcuts, like /welcome. The paperclip beside it sends a photo, audio or document.",
      },
    ],
  },

  "/hub/manager/tasks": {
    title: "Tasks",
    summary: "The team's task and project manager, as a list or a kanban board.",
    docsArticleId: "mgr-tarefas",
    sections: [
      {
        heading: "Projects and the inbox",
        body: "The side menu lists the projects. Each project has its own set of status columns. Tasks with no project go to the Inbox.",
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
          "Project and Column decide where it starts; with no project, it goes to the Inbox.",
          "Due Date is the deadline.",
          "Assignees puts the task on specific people.",
          "Recurring Task recreates it automatically each cycle — handy for routines like checking incomplete onboarding profiles.",
        ],
      },
      {
        heading: "A suggestion on organising",
        body: "Split your fronts into separate projects (support, content, onboarding). Since each project has its own status flow, mixing fronts on one board tends to leave the columns meaningless.",
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
        text: "The side menu lists the projects. A task with no project sits in the Inbox. Worth splitting fronts — support, content, onboarding — since each project has its own columns.",
      },
      {
        id: "views",
        target: "tasks.views",
        title: "List and Kanban",
        text: "List is better for scanning what is outstanding; Kanban, for seeing where work has stalled. On a phone, the button beside the + switches between them.",
      },
      {
        id: "new",
        target: "tasks.new",
        title: "New task",
        text: "Title, description, project and column, deadline and assignees. The Recurring Task switch recreates it each cycle — good for routines like checking incomplete onboarding profiles.",
      },
    ],
  },

  "/hub/manager/learning": {
    title: "Learning Hub",
    summary:
      "The way into teaching material: study plans, lessons, learning items and placement.",
    sections: [
      {
        heading: "What lives here",
        body: "Study plan templates — generic paths that can be reused and tailored to each student. From here you also reach Lessons, Learning Items, Placement and Analytics.",
      },
      {
        heading: "Create Plan",
        body: [
          "Plan Name is how it shows up when assigning — be specific, like Business English - Beginner.",
          "Language sets which language the plan is for.",
          "Description is optional and helps whoever reuses the plan later.",
        ],
      },
      {
        heading: "The menu on each plan",
        body: [
          "Edit Path opens the editor where you build the lesson sequence.",
          "Assign Plan puts the path on a student's account.",
        ],
      },
      {
        heading: "A template is not a student's plan",
        body: "The template is the mould. Assigning creates that student's path from it; later changes to the template do not flow back to whoever already received it.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The teaching material",
        text: "Study plans start here, along with the route to lessons, learning items and placement.",
      },
      {
        id: "create",
        target: "manager-learning.create",
        title: "Create Plan",
        text: "Creates a template: a name (be specific, like Business English - Beginner), a language and an optional description that helps whoever reuses it later.",
      },
      {
        id: "list",
        target: "manager-learning.list",
        title: "The plans",
        text: "Each card is a template. In its menu, Edit Path opens the sequence editor and Assign Plan puts the path on a student's account.",
      },
      {
        id: "template",
        title: "A template is not a student's plan",
        text: "The template is the mould. Assigning creates that student's path from it — and changing the template afterwards does not flow back to whoever already received it.",
      },
    ],
  },

  "/hub/manager/learning/[id]": {
    title: "Edit Path",
    summary: "A study plan's lesson sequence, in the order the student will work through it.",
    sections: [
      {
        heading: "What you build here",
        body: "The Lessons in sequence: the order the student will work through the plan. Each item is a lesson from the curriculum library.",
      },
      {
        heading: "The controls",
        body: [
          "Add lesson opens the library search, by title.",
          "The drag handle on each item reorders the sequence.",
          "The bin removes the lesson from the path — the lesson itself stays in the library.",
        ],
      },
      {
        heading: "Order matters",
        body: "This sequence is what the student sees as their path, day by day. A lesson out of order shows up as a prerequisite they have not covered yet.",
      },
      {
        heading: "Saving",
        body: "Changes are written to the plan. If this is a template, they apply to future assignments, not to students who already received the path.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The plan's sequence",
        text: "This is where you set the order the student will work through the lessons.",
      },
      {
        id: "sequence",
        target: "manager-path.sequence",
        title: "Lessons in sequence",
        text: "Each item is a lesson from the library. The drag handle reorders, and the bin takes the lesson out of the path without deleting it from the library.",
      },
      {
        id: "add",
        target: "manager-path.add",
        title: "Add lesson",
        text: "Opens the library search by title. Only lessons that already exist in the curriculum can go in.",
      },
      {
        id: "order",
        title: "Order matters",
        text: "This sequence is what the student sees day by day. A lesson out of order becomes a prerequisite they have not covered.",
      },
    ],
  },

  "/hub/manager/learning/lessons": {
    title: "Lessons",
    summary:
      "Where teaching material is produced, reviewed and published to teachers.",
    docsArticleId: "mgr-licoes",
    sections: [
      {
        heading: "Ready is what counts",
        body: "A lesson only appears in the teachers' library once it is marked ready. Until then it is visible only to the people producing it.",
      },
      {
        heading: "Create Lesson",
        body: [
          "Lesson Title is how it appears in the library.",
          "Difficulty Level sets who it is for.",
          "Study Language is the language being taught.",
          "Native Language is the support language in the explanations.",
          "Create and Continue opens the step editor.",
        ],
      },
      {
        heading: "Deleting a lesson",
        body: "The deletion is logical: the lesson stops being available for new plans, but assignments that already exist keep working. Nobody loses content midway through their path because of it.",
      },
      {
        heading: "Publish only what has been reviewed",
        body: "Teachers use this material live, with a student on screen. A mistake in a published lesson shows up at the worst possible moment.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Producing the material",
        text: "Lessons are created, reviewed and published here. Only the ones marked ready reach teachers.",
      },
      {
        id: "create",
        target: "manager-lessons.create",
        title: "Create Lesson",
        text: "Title, difficulty level, study language and native language. Create and Continue opens the step editor, which takes the lesson from draft to published.",
      },
      {
        id: "list",
        target: "manager-lessons.list",
        title: "The lessons",
        text: "Each card shows the lesson's status. Open one to pick up where the work stopped.",
      },
      {
        id: "delete",
        title: "Deleting is logical, not destructive",
        text: "The lesson leaves new plans, but existing assignments keep working — nobody is left without content midway through their path.",
      },
      {
        id: "review",
        title: "Publish only what has been reviewed",
        text: "A teacher uses this material live, with a student on screen. A mistake in a published lesson shows up at the worst possible moment.",
      },
    ],
  },

  "/hub/manager/learning/lessons/[lessonId]": {
    title: "Lesson Editor",
    summary:
      "The 11-step path that takes a lesson from draft to published, with AI support.",
    docsArticleId: "mgr-licoes",
    sections: [
      {
        heading: "The 11 steps",
        body: [
          "1 Setup: the lesson's configuration. 2 Media: uploading the video or audio. 3 Transcript: editing the transcribed text.",
          "4 Analysis I: the AI scans the transcript for vocabulary and structures. 5 Editor: the lesson content itself.",
          "6 Audit: the teaching review. 7 Extraction: the final learning items. 8 Review: each item's priority.",
          "9 Quiz: generating the test. 10 Quiz Editing: adjusting the questions by hand. 11 Ready: the lesson published.",
        ],
      },
      {
        heading: "The steps are sequential",
        body: "Each step depends on the one before, and the screen tells you when you try to skip ahead. You can leave midway and come back: progress is saved on the draft.",
      },
      {
        heading: "The AI proposes, you decide",
        body: "The scan, the item extraction and the quiz generation are AI suggestions. The review steps exist precisely so you can correct them before publishing — a badly classified item goes straight into students' daily practice.",
      },
      {
        heading: "Only step 11 publishes",
        body: "Until then the lesson is a draft and does not appear to teachers. Reaching the last step is what makes it usable in class.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "From draft to published",
        text: "Eleven steps, from uploading the media to a finished lesson. The AI helps at several of them, but you are the one who approves.",
      },
      {
        id: "stepper",
        target: "manager-lesson-editor.stepper",
        title: "The steps",
        text: "Setup, Media, Transcript, Analysis, Editor, Audit, Extraction, Review, Quiz, Quiz Editing and Ready. They are sequential: the screen tells you when an earlier one is unfinished.",
      },
      {
        id: "content",
        target: "manager-lesson-editor.content",
        title: "The current step",
        text: "The work for the step you are on. You can leave midway and come back — progress is saved on the draft.",
      },
      {
        id: "ai",
        title: "The AI proposes, you decide",
        text: "The scan, item extraction and quiz generation are suggestions. The review steps exist so you can correct them before publishing: a badly classified item lands straight in students' daily practice.",
      },
      {
        id: "publish",
        title: "Only step 11 publishes",
        text: "Until it reaches Ready, the lesson is a draft and does not appear to teachers.",
      },
    ],
  },

  "/hub/manager/learning/learning-items": {
    title: "Learning Items",
    summary:
      "The vocabulary and structure units that feed students' daily practice.",
    docsArticleId: "mgr-itens",
    sections: [
      {
        heading: "What an item is",
        body: "The smallest unit of content: a vocabulary word or a grammar structure. Adaptive daily practice distributes these items according to the student's level and what they have been getting wrong.",
      },
      {
        heading: "The filters and the search",
        body: [
          "The search looks for a word, a phrase or a translation.",
          "The language filter opens on All Languages.",
          "The level filter opens on All Levels.",
        ],
      },
      {
        heading: "What an item's record holds",
        body: "Translation, phonetics, type, meanings, explanation and examples. It is what the student ends up seeing in practice and in their notebook.",
      },
      {
        heading: "Why the level classification matters so much",
        body: "An item's level decides who it appears for. Classified below what it is, it becomes a crutch that is too easy; above, it becomes frustration. The quality and level of items directly shape the daily practice experience.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The building blocks of daily practice",
        text: "Each item is a word or a structure. This is what adaptive practice distributes to students based on their level and their mistakes.",
      },
      {
        id: "filters",
        target: "manager-items.filters",
        title: "Search and filters",
        text: "The search accepts a word, a phrase or a translation. The language and level filters open on All — narrow them before concluding something does not exist.",
      },
      {
        id: "list",
        target: "manager-items.list",
        title: "The items",
        text: "Each item is tagged Vocabulary or Structure. Open one to see its translation, phonetics, meanings, explanation and examples.",
      },
      {
        id: "level",
        title: "The level is the critical part",
        text: "An item's level decides who it appears for. Below what it is, it becomes a crutch; above, frustration. It is the field that most affects the daily practice experience.",
      },
    ],
  },

  "/hub/manager/learning/placement": {
    title: "Placement Management",
    summary:
      "The question bank for the test that places a student at a level when they join.",
    docsArticleId: "mgr-nivelamento",
    sections: [
      {
        heading: "What the test is for",
        body: "It places a student at a level on entry. The result guides class planning and gives a marker for tracking progress later.",
      },
      {
        heading: "What the screen shows",
        body: [
          "The Language selector picks which question bank you are looking at.",
          "Two counters show how many Active Questions exist (the ones that go into tests) and how many Drafts have not been released yet.",
        ],
      },
      {
        heading: "Generate Questions",
        body: "Opens the generator: you pick the study items and audio that will serve as the basis, and the AI proposes questions from them. You then review, edit and save the ones worth keeping.",
      },
      {
        heading: "Changing the test moves the ruler",
        body: "Older results were measured against the previous version of the bank. Comparing students assessed under different versions calls for care — and it is worth recording when a large change went in.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The placement bank",
        text: "The questions that place a student at a level when they join the school.",
      },
      {
        id: "language",
        target: "manager-placement.language",
        title: "The language",
        text: "Each language has its own bank. Switch here before concluding that questions are missing.",
      },
      {
        id: "tabs",
        target: "manager-placement.stats",
        title: "Active and Drafts",
        text: "Two counters: Active Questions are the ones that go into real tests; Drafts are the generated or written ones not yet released. Drafts piling up means review has stalled.",
      },
      {
        id: "generate",
        target: "manager-placement.generate",
        title: "Generate Questions",
        text: "You pick the study items and audio to base them on, and the AI proposes questions. They start as drafts: review and edit before activating.",
      },
      {
        id: "ruler",
        title: "Changing the test moves the ruler",
        text: "Older results were measured against the previous version. Comparing students assessed under different versions calls for care.",
      },
    ],
  },

  "/hub/manager/learning/analytics": {
    title: "Learning Analytics",
    summary: "The content performance dashboard — not available yet.",
    docsArticleId: "mgr-analytics",
    sections: [
      {
        heading: "This screen is not ready yet",
        body: "The dashboard shows a notice saying it is on the way. It will show student progress, completion rates and path performance, but it carries no data yet.",
      },
      {
        heading: "In the meantime",
        body: "To understand where students are stuck, the route today is the student's record (classes and curriculum) and Learning Items, where you can review items that look badly classified.",
      },
      {
        heading: "When it is ready",
        body: "It will answer two questions: which content is being consumed and where students are stopping. An item with an error rate far above average is usually a confusing prompt or a bad level classification, not a difficult topic.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Still being built",
        text: "This screen shows a notice that the dashboard is on the way. It carries no data yet — that is not your mistake or a loading failure.",
      },
      {
        id: "meanwhile",
        title: "In the meantime",
        text: "To find where students get stuck, use the student's record (classes and curriculum) and Learning Items, reviewing the ones that look badly classified.",
      },
    ],
  },

  "/hub/manager/my-courses": {
    title: "My Learning",
    summary: "The school's training courses you are enrolled in.",
    sections: [
      {
        heading: "What lives here",
        body: "Training courses the school makes available to you. They work just like the students' courses: sections, lessons and progress saved automatically.",
      },
      {
        heading: "This is not the teaching material",
        body: "These courses are for your own development. The material teachers use in class lives under Learning, in the Lessons area.",
      },
      {
        heading: "Your progress is saved",
        body: "You can stop midway and carry on later from where you were, even on another device.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your training",
        text: "The courses the school provides for your own development — not the class material, which lives under Learning.",
      },
      {
        id: "list",
        target: "courses.list",
        title: "Your courses",
        text: "Each card is a course available to you, with the progress you have made. Tap it to open.",
      },
      {
        id: "progress",
        title: "You can stop midway",
        text: "Progress is saved automatically, so you can carry on later, even on another device.",
      },
    ],
  },

  "/hub/manager/my-courses/[id]": {
    title: "Watching the course",
    summary: "The training course player: content, lesson menu and quizzes.",
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
        heading: "Quizzes",
        body: "Some lessons end with a quiz. Finish Quiz marks it and shows your score; Practise Again retakes it as often as you like, and your last attempt is kept.",
      },
      {
        heading: "The side menu is hidden here",
        body: "So you can watch without distraction, the platform menu is hidden on this screen. Use the back button at the top to leave.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The course player",
        text: "Your study screen. Let's look at the content, the lesson menu and progress.",
      },
      {
        id: "content",
        target: "student-course-player.content",
        title: "The lesson",
        text: "Video, text or both. When a lesson has no content published yet, the screen says so.",
      },
      {
        id: "menu",
        target: "student-course-player.menu",
        title: "The course lessons",
        text: "The full list, by section, with completed ones ticked. Tap any of them to jump straight there.",
      },
      {
        id: "complete",
        target: "student-course-player.complete",
        title: "Mark as completed",
        text: "Records the lesson as done and updates the progress bar. Previous and Next follow the course order.",
      },
    ],
  },

  "/hub/manager/settings": {
    panel: "wizard",
    title: "Settings",
    summary:
      "Your details, language, theme, which alerts you receive and your account security.",
    docsArticleId: "mgr-configuracoes",
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
        text: "Photo, name, primary email (with a verified badge) and the interface language.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Notifications tab",
        text: "One switch per kind of alert. Worth keeping chat notifications on: that is how you learn a student has sent a new message to the school's WhatsApp.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Security tab — turn on 2FA",
        text: "Your account reaches personal data for the whole student base. Two-step verification uses an authenticator app and starts asking for a 6-digit code at every sign-in. It is the most effective protection against unauthorised access.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "App tab",
        text: "Installs the platform as an app on your phone or computer: it opens faster and can deliver alerts.",
      },
    ],
  },

  "/hub/manager/docs": {
    title: "Help Centre",
    summary:
      "The complete platform guide for managers, with the support playbooks.",
    sections: [
      {
        heading: "What is here",
        body: "The full guides, by subject: getting started, student support, learning, operations and common situations. It is the long version of what the (?) on each page summarises.",
      },
      {
        heading: "The support playbooks",
        body: [
          "I cannot sign in: the step-by-step for unblocking a student's access.",
          "I paid and it is still open: what to check before escalating to the admin.",
          "I want to cancel my enrolment: how to handle it without promising what you do not execute.",
          "The teacher did not turn up: how to record it and make sure the student gets their credit.",
        ],
      },
      {
        heading: "The rules you will explain most",
        body: "Cancellation and rescheduling (the 4-hour rule, the limit of 2 reschedules a month) and the kinds and expiry of credits. Worth reading before you need them.",
      },
      {
        heading: "Exceptions are a human decision",
        body: "The system applies the rules automatically. Making an exception — waiving a no-show, allowing a third reschedule — is a coordination decision. Agree it before promising the student.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The complete guide",
        text: "The long version of the help, with the support playbooks that resolve most of what comes in.",
      },
      {
        id: "search",
        target: "docs.search",
        title: "The search",
        text: "It looks through the whole text of the articles. Search using the student's own words, like I paid and it is still open.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "The subjects",
        text: "Getting started, student support, learning, operations and common situations. Common Situations is where the support playbooks live.",
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
