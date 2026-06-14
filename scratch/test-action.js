const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

require('tsx/register');

const { contractRepository } = require('../modules/contract/contract.repository');

async function main() {
  try {
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
