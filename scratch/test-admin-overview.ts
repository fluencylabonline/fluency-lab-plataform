const fs = require("fs");
const path = require("path");

// Set up environment variables manually
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  if (line.trim() && !line.startsWith("#")) {
    const parts = line.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = val;
  }
}

async function main() {
  const { dashboardService } = require("../modules/dashboard/dashboard.service");
  try {
    console.log("Calling getAdminOverview()...");
    const overview = await dashboardService.getAdminOverview();
    console.log("Overview Results:");
    console.log(JSON.stringify(overview, null, 2));
  } catch (err) {
    console.error("Error calling overview service:", err);
  }
}

main();
