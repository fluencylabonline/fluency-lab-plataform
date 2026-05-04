import { notebookRepository } from "./modules/notebook/notebook.repository.js";
import { adminDb } from "./lib/firebase-admin.js";

async function syncAll() {
  console.log("Fetching notebooks from Neon...");
  const notebooks = await notebookRepository.findAll(); // I need to add this method or use a query
  
  console.log(`Syncing ${notebooks.length} notebooks to Firestore...`);
  
  for (const notebook of notebooks) {
    await adminDb.collection("Notebooks").doc(notebook.id).set({
      title: notebook.title,
      studentId: notebook.studentId,
      teacherId: notebook.teacherId,
      createdAt: notebook.createdAt,
    }, { merge: true });
    console.log(`Synced: ${notebook.title} (${notebook.id})`);
  }
  
  console.log("Sync complete!");
}

syncAll().catch(console.error);
