import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import ws from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

async function main() {
  try {
    const { activateContractTemplateAction } = await import('../modules/contract/contract.actions');
    const { contractRepository } = await import('../modules/contract/contract.repository');
    
    // Find an inactive student template to activate
    const templates = await contractRepository.findAllTemplates();
    const inactiveStudent = templates.find(t => t.type === 'student' && !t.isActive);
    if (!inactiveStudent) {
      console.log("No inactive student templates found.");
      return;
    }
    
    console.log("Calling action for template ID:", inactiveStudent.id);
    const result = await activateContractTemplateAction({ id: inactiveStudent.id });
    console.log("ACTION RESULT:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
