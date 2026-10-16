import { getDatabase } from "firebase/database";
import { app } from "./firebase-app";

export const rtdb = getDatabase(app);
