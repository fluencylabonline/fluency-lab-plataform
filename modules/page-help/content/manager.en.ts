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

  "/hub/manager/courses": {
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

  "/hub/manager/courses/[id]": {
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

  "/hub/manager/courses/[id]/lessons/[lessonId]": {
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

  "/hub/manager/holiday-classes": {
    title: "Holiday Classes",
    summary: "The recorded class packages students watch during the year-end break.",
    sections: [
      {
        heading: "What it is for",
        body: "From Dec 18 to Jan 14 there are no live classes. During that period the next-class card on the student's profile becomes a shortcut to these recorded classes, and students get emails on Dec 1 and Dec 15 with the link. Outside the period, packages stay available for review.",
      },
      {
        heading: "How to build one",
        body: [
          "Create holiday package opens the form with title, description, language and cover. The package is always for students.",
          "Inside the package, create the modules and the lessons. Each lesson can have video (YouTube or Google Drive), text, downloadable attachments and a quiz.",
          "The package starts as a draft. Publish it only when it is ready: publishing is what makes it show up for students.",
        ],
      },
      {
        heading: "Not the same as recess activities",
        body: "A teacher's recess activities are text lessons tied to a specific class. These are recorded, shared classes, the same for every student.",
      },
    ],
    tour: [
      {
        id: "intro",
        title: "Recorded holiday classes",
        text: "Class packages for the year-end break, when there are no live classes. Every package starts as a draft.",
      },
      {
        id: "create",
        target: "admin-courses.create",
        title: "Create a package",
        text: "Title, description, language and cover. Then build the modules and lessons inside it and publish.",
      },
      {
        id: "list",
        target: "admin-courses.list",
        title: "The packages",
        text: "Click a package to build its modules and lessons. The menu has Edit and Delete.",
      },
    ],
  },
  "/hub/manager/holiday-classes/[id]": {
    title: "Holiday Package",
    summary: "The modules and lessons of a recorded class package.",
    sections: [
      {
        heading: "Modules and lessons",
        body: "Organise the package into modules (by week, level or topic) and add lessons to each one. Click a lesson to edit its content.",
      },
      {
        heading: "Publishing",
        body: "While it is a draft, the package does not show up for students. Publish it when the lessons are ready; unpublishing hides it and keeps the progress of anyone who already started.",
      },
    ],
    tour: [
      {
        id: "sections",
        target: "admin-course-detail.sections",
        title: "Modules and lessons",
        text: "Create the package's modules and lessons. Click a lesson to open the editor.",
      },
    ],
  },
  "/hub/manager/holiday-classes/[id]/lessons/[lessonId]": {
    title: "Holiday Lesson",
    summary: "The editor for a recorded lesson: video, text, attachments and quiz.",
    sections: [
      {
        heading: "The blocks",
        body: [
          "Add video accepts YouTube or Google Drive links.",
          "Add text opens a rich text editor.",
          "Add attachment uploads a file (PDF, image, audio, Word, Excel, PowerPoint or ZIP, up to 50MB) that students download in the lesson.",
        ],
      },
      {
        heading: "Saving",
        body: "Changes, including uploaded attachments, only count after you save the lesson.",
      },
    ],
    tour: [
      {
        id: "blocks",
        target: "admin-lesson-editor.blocks",
        title: "Lesson content",
        text: "Video, text and attachments, in the order students will see them.",
      },
      {
        id: "save",
        target: "admin-lesson-editor.save",
        title: "Save",
        text: "Nothing counts until you save, attachments included.",
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
    ],
  },
};
