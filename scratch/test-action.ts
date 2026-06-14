import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import ws from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

async function main() {
  try {
    const { contractRepository } = await import('../modules/contract/contract.repository');
    const templates = await contractRepository.findAllTemplates();
    if (templates.length === 0) {
      console.log("No templates found.");
      return;
    }
    const templateToActivate = templates[0];
    console.log("Activating template:", templateToActivate.id, templateToActivate.type, templateToActivate.region);
    
    const result = await contractRepository.activateTemplate(
      templateToActivate.id,
      templateToActivate.type,
      templateToActivate.region
    );
    console.log("ACTIVATE RESULT:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
