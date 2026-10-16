/**
 * Compatibilidade: reexporta todos os serviços. Importar daqui puxa o SDK
 * inteiro do Firebase — prefira o módulo do serviço (`@/lib/firebase-rtdb`,
 * `@/lib/firebase-storage`, `@/lib/firebase-firestore`, `@/lib/firebase-auth`).
 */
export { app } from "./firebase-app";
export { auth } from "./firebase-auth";
export { storage } from "./firebase-storage";
export { db } from "./firebase-firestore";
export { rtdb } from "./firebase-rtdb";
