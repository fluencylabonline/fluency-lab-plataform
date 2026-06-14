import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import { transactionsTable } from "../modules/finance/finance.schema";
import { dashboardRepository } from "../modules/dashboard/dashboard.repository";

async function main() {
  try {
    console.log("Testing Database Connection...");
    const countResult = await db.execute(
      // just a simple query to verify connection
      "SELECT count(*) FROM transactions;"
    );
    console.log("Total rows in transactions table:", countResult.rows[0]);

    console.log("Getting Cash Flow...");
    const cashFlow = await dashboardRepository.getCashFlow(6);
    console.log("Cash Flow Raw:", cashFlow);

    console.log("Getting Pending Revenue...");
    const pendingRevenue = await dashboardRepository.getPendingRevenue();
    console.log("Pending Revenue Raw:", pendingRevenue);
  } catch (error) {
    console.error("Error running test query:", error);
  }
  process.exit(0);
}

main();
