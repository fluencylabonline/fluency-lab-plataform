import type { RoleHelpContent, TeacherHelpRoute } from "../page-help.types";

/**
 * Ajuda das páginas do professor — inglês.
 *
 * Tradução de `teacher.pt.ts`: mesmos `id` de passo, mesma quantidade de seções
 * e a mesma ordem.
 */
export const TEACHER_HELP_EN: RoleHelpContent<TeacherHelpRoute> = {
  "/hub/teacher/profile": {
    title: "My Profile",
    summary: "Your registration details and the starting point of your day.",
    docsArticleId: "prof-visao-geral",
    sections: [
      {
        heading: "What lives here",
        body: "Your registration details, photo and contact information. This is the screen that opens when you sign in.",
      },
      {
        heading: "Where everything lives",
        body: [
          "Students: the students assigned to you, with each one's history and progress.",
          "My Schedule: your classes, your availability and the record of what happened in each session.",
          "Lessons: the library of teaching material ready to use in class.",
          "My Learning: the training courses you are enrolled in.",
          "Contract: your service contract.",
          "Settings: password, notifications and preferences.",
        ],
      },
      {
        heading: "Before your first class",
        body: "Two things have to be done: signing your contract and registering your availability in My Schedule. Without availability you do not appear as an option on the scheduling screens, and no student can be assigned to you.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your home page",
        text: "Your registration details live here. The day-to-day work happens in My Schedule and Students.",
      },
      {
        id: "nav",
        target: "chrome.nav",
        title: "Getting around",
        text: "Students, My Schedule, Lessons, My Learning, Contract and Settings. On a phone this menu sits in the bottom bar.",
      },
      {
        id: "first-steps",
        title: "Before your first class",
        text: "Sign your contract and register your availability in My Schedule. While your availability is empty you do not appear on the scheduling screens and no student can be assigned to you.",
      },
      {
        id: "help",
        target: "chrome.help",
        title: "This button is on every page",
        text: "The (?) explains the screen you are on, with a walkthrough like this one. For the full guides, use the Help Centre in the menu.",
      },
    ],
  },

  "/hub/teacher/schedule": {
    title: "My Schedule",
    summary:
      "Your classes, your availability, the record of each session and your recess periods.",
    docsArticleId: "prof-disponibilidade",
    sections: [
      {
        heading: "What the calendar shows",
        body: "Your classes and your open slots. Click a class to see the details, record what happened or cancel it. Click an open slot to view or remove that availability.",
      },
      {
        heading: "The four buttons",
        body: [
          "Create Slot opens an availability slot. It is what allows students to be assigned to you.",
          "Recess Activities takes you to the library where you build the lessons that replace your classes during an absence.",
          "Recesses shows the recesses you have requested and the approval status of each.",
          "Communicate Recess opens a request for a new period of absence.",
        ],
      },
      {
        heading: "Availability is recurring",
        body: [
          "You set the weekly slot and the system replicates it over the coming months automatically.",
          "A slot already taken by a fixed student does not show as free to anyone else.",
          "Removing availability does not delete classes already scheduled in that slot — those have to be handled one by one.",
          "To change a student's fixed slot permanently, talk to the school office: touching only your availability does not move the recurring class that already exists.",
        ],
      },
      {
        heading: "Recording what happened in a class",
        body: [
          "Completed: the class happened. It counts as a class given and enters your payout at your current hourly rate.",
          "Student no-show: the student did not turn up and did not give notice in time. It counts as a class given — you are paid for it — and the student gets no make-up.",
          "Cancelled by me: automatically creates a make-up credit for the student, who reschedules without spending their monthly quota. It does not count as a class given and does not enter your payout.",
        ],
      },
      {
        heading: "Record it the same day",
        body: "An unrecorded class stays pending and is later flagged as overdue by the system. The payout uses whatever is recorded on the cut-off date: a class recorded after the cut-off only lands in the following month.",
      },
      {
        heading: "The recess rules",
        body: "A recess needs at least 30 calendar days' notice and cannot run longer than 15 calendar days. Outside that the system blocks it. Before confirming, you have to pick a recess activity for every affected class — the activity does not have to be yours, any lesson in the library works. Students and the coordination team are notified on confirmation.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your schedule",
        text: "This is where you open slots, record what happened in each class and communicate absences. Let's go part by part.",
      },
      {
        id: "calendar",
        target: "teacher-schedule.calendar",
        title: "The calendar",
        text: "Your classes and your open slots. Click a class to record what happened or cancel it; click an open slot to view or remove that availability.",
      },
      {
        id: "create-slot",
        target: "teacher-schedule.create-slot",
        title: "Create Slot",
        text: "Opens an availability slot. It is recurring: you set the weekly time and the system replicates it over the coming months. While your availability is empty, no student can be assigned to you.",
      },
      {
        id: "register",
        target: "teacher-schedule.calendar",
        title: "Recording the class",
        text: "Completed counts as a class given and enters your payout. Student no-show also counts and is paid. Cancelled by me creates a credit for the student and does not enter your payout. Record it the same day: the payout uses what was recorded at cut-off.",
      },
      {
        id: "recess-library",
        target: "teacher-schedule.recess-library",
        title: "Recess Activities",
        text: "The library of lessons that replace your classes during an absence. Worth building yours before you need them.",
      },
      {
        id: "communicate-recess",
        target: "teacher-schedule.communicate-recess",
        title: "Communicate Recess",
        text: "Requests a period of absence. It needs at least 30 calendar days' notice and at most 15 calendar days of duration — outside that the system blocks it. You also pick an activity for each affected class before confirming.",
      },
      {
        id: "check-recess",
        target: "teacher-schedule.check-recess",
        title: "Recesses",
        text: "Your recess requests and the status of each: approved automatically when it is within the notice period, or under review when it needs the coordination team's sign-off.",
      },
    ],
  },

  "/hub/teacher/students": {
    panel: "wizard",
    title: "My Students",
    summary: "The students with a class scheduled with you, each with a full record.",
    docsArticleId: "prof-lista-alunos",
    tour: [
      {
        id: "intro",
        title: "Your students",
        text: "The list holds the students with a class scheduled with you. Click a name to open their record: classes, notebooks, study plan and placement level.",
      },
      {
        id: "list",
        target: "teacher-students.list",
        title: "The list",
        text: "One card per student. Tap it to open their full record.",
      },
      {
        id: "search",
        target: "chrome.search",
        title: "Search by name or email",
        text: "The search at the top of the header filters the list by name or email, which helps once you have many students.",
      },
      {
        id: "privacy",
        title: "You only see yours",
        text: "For data protection, your view is limited to the students assigned to you, and to teaching data only. Financial information and personal documents are restricted to the administration.",
      },
      {
        id: "missing",
        title: "A student disappeared from the list?",
        text: "The list depends on there being a class scheduled with you. A student with no class booked, or reassigned to another teacher, stops appearing. If that looks wrong, talk to the school office.",
      },
    ],
  },

  "/hub/teacher/students/[studentId]": {
    panel: "wizard",
    title: "Student record",
    summary:
      "Everything about one of your students: class notebooks, study plan and session history.",
    docsArticleId: "prof-lista-alunos",
    tour: [
      {
        id: "intro",
        title: "The student record",
        text: "Three panels, one per subject. On a desktop they sit side by side; on a tablet or phone, behind the buttons at the top.",
      },
      {
        id: "notebooks",
        target: "teacher-student-detail.notebooks",
        title: "Notebooks",
        text: "One notebook per class. New creates the notebook for the next class, the search finds an older one by title, and the cloud icon downloads a PDF. Delete moves it to the bin, with permanent removal after 60 days.",
      },
      {
        id: "plan",
        target: "teacher-student-detail.plan",
        title: "Study plan",
        text: "The student's lesson path. You can add a single lesson, apply a whole plan template and reorder what is already there. This is what the student sees as their path in their Notebook.",
      },
      {
        id: "classes",
        target: "teacher-student-detail.classes",
        title: "Classes",
        text: "The session history with the status of each. This is where you change a class's status and write the feedback the student reads afterwards.",
      },
      {
        id: "feedback",
        target: "teacher-student-detail.classes",
        title: "Class feedback",
        text: "Write for someone rereading it days later, without the context of the conversation. It is the main tool of continuity between one class and the next.",
      },
    ],
  },

  "/hub/teacher/students/[studentId]/profile": {
    title: "Teaching Diagnosis",
    summary:
      "A report on the student, generated by artificial intelligence from the enrolment questionnaire and the placement test.",
    sections: [
      {
        heading: "What this report is",
        body: "An AI reading of the student, cross-referencing their enrolment questionnaire answers with their placement result: goal, context, points to watch and suggested directions. It is the context the class list cannot give you.",
      },
      {
        heading: "Structural Data",
        body: [
          "Perceived Level is the level the student assigned to themselves at enrolment — it may not match the placement test, and that gap is information in itself.",
          "Commitment is how much they said they intend to dedicate, from 0 to 10.",
        ],
      },
      {
        heading: "For you it is read only",
        body: "Teachers view, they do not edit. Generating or regenerating the diagnosis and creating a plan from it are coordination actions. If something in the report looks wrong, talk to them.",
      },
      {
        heading: "When it is worth opening",
        body: [
          "Before the first class, so you do not start in the dark.",
          "When a student seems unmotivated: often their goal has changed and the plan has not kept up.",
          "When revising the study plan, to check it still serves the stated goal.",
        ],
      },
      {
        heading: "Empty report?",
        body: "If it says the diagnosis is awaiting generation, the coordination team has not generated it yet. The student's questionnaire can be answered without the report existing.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The student's context",
        text: "A teaching report generated by AI from the enrolment questionnaire and the placement test. Worth reading before the first class.",
      },
      {
        id: "report",
        target: "teacher-student-profile.report",
        title: "Teaching Report",
        text: "The AI's reading of the student: goal, context, points to watch and suggestions. At the foot are the reference and the date it was last updated — worth checking it is not stale.",
      },
      {
        id: "metrics",
        target: "teacher-student-profile.metrics",
        title: "Structural Data",
        text: "Perceived Level is what the student assigned to themselves at enrolment, and may not match the placement test — the gap is information. Commitment is how much they said they intend to dedicate, from 0 to 10.",
      },
      {
        id: "read-only",
        title: "For you it is read only",
        text: "Generating the diagnosis and creating a plan from it are coordination actions. If something here looks wrong, talk to them.",
      },
      {
        id: "use",
        title: "How to use it",
        text: "Check the study plan still serves the stated goal. If a student seems unmotivated, compare what they asked for at the start with what they are getting — that is usually where the answer is.",
      },
    ],
  },

  "/hub/teacher/lessons": {
    title: "Lessons",
    summary:
      "The library of ready teaching material, filterable by language and level.",
    docsArticleId: "prof-licoes",
    sections: [
      {
        heading: "What lives here",
        body: "The teaching material already produced and reviewed by the school. Open a lesson to use during class or as the basis for your own planning.",
      },
      {
        heading: "The filters",
        body: "Level and language are clickable tags: clicking one applies the filter, clicking the same one again removes it. The header search looks through titles. Combining level with a search is the fastest route once the library gets large.",
      },
      {
        heading: "Only finished material appears",
        body: "The list shows only lessons marked as ready. Material still in production is visible only to the people building it — so a lesson you heard someone mention may not be here yet.",
      },
      {
        heading: "These are not the recess activities",
        body: "The recess library is a different screen, reached from My Schedule. A lesson from here can be used as a recess activity when you communicate an absence.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The lesson library",
        text: "Teaching material ready to use in class, produced and reviewed by the school.",
      },
      {
        id: "filters",
        target: "teacher-lessons.filters",
        title: "Filter by level and language",
        text: "They are clickable tags: click to filter, click the same one again to remove it. Together with the title search in the header, it is the fastest way to find something usable.",
      },
      {
        id: "list",
        target: "teacher-lessons.list",
        title: "The lessons",
        text: "Tap a lesson to open its content. Only lessons marked ready appear — material in production is not visible here.",
      },
    ],
  },

  "/hub/teacher/lessons/[lessonId]": {
    title: "Lesson",
    summary: "The content of a library lesson, to use in class.",
    docsArticleId: "prof-licoes",
    sections: [
      {
        heading: "What you see",
        body: "On one side, the full content of the lesson. On the other, the Learning Items it covers, split into Vocabulary and Structures, each with its translation. At the top are two tags: the lesson's level and language.",
      },
      {
        heading: "This screen is read only",
        body: "The lesson belongs to the school's library. You do not edit it from here — suggested corrections go to the coordination team.",
      },
      {
        heading: "Using it with a student",
        body: "To put this lesson on someone's path, open the student's record and use the study plan panel. The lesson appears in the lesson search there.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "The lesson content",
        text: "Ready to use live or as the basis for your planning.",
      },
      {
        id: "content",
        target: "teacher-lesson.content",
        title: "The material",
        text: "The lesson content in the order it was built. The screen is read only: the lesson belongs to the school's library. On a phone, this is the Content tab's panel.",
      },
      {
        id: "items",
        target: "teacher-lesson.items",
        title: "Learning Items",
        text: "What the lesson covers, split into Vocabulary and Structures, each with its translation. Useful for quickly checking the lesson matches what your student needs. On a phone it sits under the Vocabulary tab.",
      },
      {
        id: "assign",
        title: "To use it with a student",
        text: "Open the student's record and add this lesson from the study plan panel. It appears in the lesson search there.",
      },
    ],
  },

  "/hub/teacher/my-courses": {
    title: "My Learning",
    summary: "The school's training courses you are enrolled in.",
    docsArticleId: "prof-meu-aprendizado",
    sections: [
      {
        heading: "What lives here",
        body: "Training and development courses the school makes available to you. They work just like the students' courses: sections, lessons and progress saved automatically.",
      },
      {
        heading: "This is not the lesson library",
        body: "These courses are for your own development. The material you use in class with students lives under Lessons.",
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
        text: "The courses the school provides for your own development — not the class material, which lives under Lessons.",
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

  "/hub/teacher/my-courses/[id]": {
    title: "Watching the course",
    summary: "The training course player: content, lesson menu and quizzes.",
    docsArticleId: "prof-meu-aprendizado",
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

  "/hub/teacher/recess": {
    title: "Recess Library",
    summary: "The activities that replace your classes while you are on recess.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "What it is for",
        body: "When you communicate a recess, the system requires an activity for every affected class — the student does that activity instead of the session. This is the library those activities come from.",
      },
      {
        heading: "The buttons",
        body: [
          "Create a lesson opens the editor for an activity of your own, with text and a quiz.",
          "The pencil on each card opens that activity for editing.",
          "The cards show language and level, so you can find the one that suits each student.",
        ],
      },
      {
        heading: "It does not have to be yours",
        body: "When communicating a recess you can pick any activity already in the library, including other teachers'. Creating your own is optional — but it gives you more control over what your students receive.",
      },
      {
        heading: "Build them before you need them",
        body: "A recess needs 30 calendar days' notice, and you cannot confirm the request without picking an activity for every class. Having yours ready avoids a scramble at that moment.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Activities for your recess",
        text: "When you are away, every affected class needs an activity in its place. They live here.",
      },
      {
        id: "new",
        target: "teacher-recess.new",
        title: "Create a lesson",
        text: "Opens the editor for an activity of your own, with text and a quiz. At recess time you can also use other teachers' activities — creating your own is optional, but gives you more control.",
      },
      {
        id: "list",
        target: "teacher-recess.list",
        title: "The library",
        text: "Each card shows language and level, so you can pick the one that suits each student. The pencil opens it for editing.",
      },
      {
        id: "plan-ahead",
        title: "Build them before you need them",
        text: "A recess needs 30 calendar days' notice and will not let you confirm without an activity chosen for every class. Having yours ready avoids a scramble.",
      },
    ],
  },

  "/hub/teacher/recess/new": {
    title: "New Recess Activity",
    summary:
      "Build an activity — text and a quiz — for students to do while you are away.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "The header fields",
        body: [
          "Title: how the activity appears in the library and when picking one. Be specific.",
          "Language: the language of the activity.",
          "Level: who it is for. It is what lets you pick the right one per student later.",
          "Native language: the support language for the instructions.",
        ],
      },
      {
        heading: "The two buttons that switch the panel",
        body: [
          "Activity Content opens the editor for the text the student reads. It accepts formatting.",
          "Assessment (Quiz) opens the quiz. The number beside it shows how many questions already exist.",
        ],
      },
      {
        heading: "Building the quiz",
        body: [
          "New Question adds a question.",
          "Each question has the prompt and the answer options, with the correct one marked.",
          "Pass Mark sets the percentage of correct answers counted as a pass.",
          "The quiz is optional: an activity with only text is valid.",
        ],
      },
      {
        heading: "On saving",
        body: "Create Activity puts it in the library, available to you and to other teachers when communicating a recess.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Creating an activity",
        text: "Two parts: the content the student reads and, if you want one, a quiz to check their understanding.",
      },
      {
        id: "meta",
        target: "teacher-recess-editor.meta",
        title: "Title, language and level",
        text: "The title is how the activity appears when picking one — be specific. Language and level are what let you find the right activity per student later.",
      },
      {
        id: "tabs",
        target: "teacher-recess-editor.tabs",
        title: "Content and Assessment",
        text: "These two buttons switch the panel beside them. Activity Content is the text the student reads; Assessment (Quiz) is the quiz, with the question count beside it. The quiz is optional: an activity with only text is valid.",
      },
      {
        id: "quiz",
        target: "teacher-recess-editor.tabs",
        title: "Building the quiz",
        text: "New Question adds a prompt with its options and the correct answer marked. Pass Mark sets the percentage of correct answers that counts as a pass.",
      },
      {
        id: "save",
        target: "teacher-recess-editor.save",
        title: "Create Activity",
        text: "Saves it to the library. From then on it can be picked for any recess, yours or another teacher's.",
      },
    ],
  },

  "/hub/teacher/recess/[id]": {
    title: "Edit Recess Activity",
    summary: "Adjust the text, the quiz or the level of an activity that already exists.",
    docsArticleId: "prof-recesso",
    sections: [
      {
        heading: "What you can change",
        body: "Everything: title, language, level, the activity text and the quiz questions. Save Changes writes over the previous version.",
      },
      {
        heading: "Careful editing an activity in use",
        body: "If this activity has already been picked for a recess in progress, the change applies to students who have not done it yet. For substantially different content, prefer creating a new activity rather than reusing this one.",
      },
      {
        heading: "The quiz",
        body: "New Question adds a prompt, the bin icon removes one. Pass Mark sets the percentage of correct answers that counts as a pass. Removing every question leaves the activity with text only, which is valid.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Editing the activity",
        text: "Everything is editable: title, language, level, text and quiz.",
      },
      {
        id: "meta",
        target: "teacher-recess-editor.meta",
        title: "Title, language and level",
        text: "Changing the level changes which students this activity will show up for as a suitable option in future recesses.",
      },
      {
        id: "tabs",
        target: "teacher-recess-editor.tabs",
        title: "Content and Assessment",
        text: "These two buttons switch the panel beside them. Under Assessment (Quiz) you add or remove questions and adjust the Pass Mark. With no questions, the activity is text only — which is valid.",
      },
      {
        id: "save",
        target: "teacher-recess-editor.save",
        title: "Save Changes",
        text: "Writes over the previous version. If the activity is already in use in a recess in progress, the change applies to whoever has not done it yet.",
      },
    ],
  },

  "/hub/teacher/contract": {
    title: "My Contract",
    summary: "Your service contract: where to read it, sign it and download the PDF.",
    docsArticleId: "prof-contrato",
    sections: [
      {
        heading: "What lives on this screen",
        body: "Your contract with the school, with its validity and current status: Active Contract, Signature Pending or Expired Contract. Close to expiry, a notice shows how many days are left.",
      },
      {
        heading: "The buttons",
        body: [
          "Download PDF saves a copy to your device.",
          "Receive by Email sends the PDF to your account's email address.",
          "If a signature is pending, the screen shows the terms and the button to sign digitally.",
        ],
      },
      {
        heading: "Sign before your first class",
        body: "While the contract is pending, your standing with the school is incomplete. It is one of the two first steps, alongside registering availability in My Schedule.",
      },
      {
        heading: "Renewal",
        body: "The contract runs for a fixed term and is renewed periodically. You are notified as renewal approaches.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Your contract",
        text: "Where to read, sign and keep your service contract.",
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
        id: "first-steps",
        title: "Sign before your first class",
        text: "A pending contract leaves your standing with the school incomplete. It is one of the two first steps, alongside registering your availability in My Schedule.",
      },
    ],
  },

  "/hub/teacher/settings": {
    panel: "wizard",
    title: "Settings",
    summary:
      "Your details, language, theme, which alerts you receive and your account security.",
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
        text: "Photo, name, primary email (with a verified badge) and the interface language. It is also where Export My Data lives, which downloads a copy of everything we hold about you.",
      },
      {
        id: "notifications",
        target: "settings.tabs",
        title: "Notifications tab",
        text: "One switch per kind of alert. Worth keeping the class and scheduling ones on: that is how you find out about a student cancelling and about changes to your schedule.",
      },
      {
        id: "security",
        target: "settings.tabs",
        title: "Security tab",
        text: "Change your password here from time to time. Two-step verification uses an authenticator app and starts asking for a 6-digit code at every sign-in — important, since your account reaches student data.",
      },
      {
        id: "app",
        target: "settings.tabs",
        title: "App tab",
        text: "Installs the platform as an app on your phone or computer: it opens faster and can deliver class alerts.",
      },
    ],
  },

  "/hub/teacher/docs": {
    title: "Help Centre",
    summary:
      "The complete platform guide for teachers, with search and a place to ask questions.",
    sections: [
      {
        heading: "What is here",
        body: "The full guides, by subject: getting started, schedule and classes, students, teaching material, contract and earnings, and common problems. It is the long version of what the (?) on each page summarises.",
      },
      {
        heading: "Finding what you need",
        body: "The search at the top looks through the whole text of the articles, not just the titles. It is worth searching for the problem in your own words — for example, the student did not turn up or my schedule is wrong.",
      },
      {
        heading: "Where the rules that cause most questions live",
        body: [
          "How your earnings are calculated, under Contract and Earnings.",
          "What each class status means for your payout.",
          "The notice and duration rules for recess.",
        ],
      },
      {
        heading: "Did not find the answer?",
        body: "You can send your question. It reaches the school, and what comes up often becomes a new article here.",
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
        text: "It looks through the whole text of the articles. Describe the problem in your own words, like the student did not turn up.",
      },
      {
        id: "sections",
        target: "docs.sections",
        title: "The subjects",
        text: "Getting started, schedule and classes, students, teaching material, contract and earnings, and common problems. Contract and Earnings is where the payment rules live.",
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
