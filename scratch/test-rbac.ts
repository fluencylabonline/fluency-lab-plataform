import { hasPermission, Role, Permission } from "../lib/rbac";

interface TestCase {
  role: Role;
  permission: Permission;
  expected: boolean;
  description: string;
}

const testCases: TestCase[] = [
  // Admin
  { role: "admin", permission: "user.create", expected: true, description: "Admin should have user.create" },
  { role: "admin", permission: "class.cancel.self", expected: true, description: "Admin should have class.cancel.self" },
  
  // Student
  { role: "student", permission: "class.view", expected: true, description: "Student should have class.view" },
  { role: "student", permission: "class.cancel.self", expected: true, description: "Student should have class.cancel.self" },
  { role: "student", permission: "user.create", expected: false, description: "Student should NOT have user.create" },
  
  // Teacher
  { role: "teacher", permission: "class.view.assigned", expected: true, description: "Teacher should have class.view.assigned" },
  { role: "teacher", permission: "vacation.create", expected: true, description: "Teacher should have vacation.create" },
  { role: "teacher", permission: "user.delete", expected: false, description: "Teacher should NOT have user.delete" },
  
  // Manager
  { role: "manager", permission: "material.create", expected: true, description: "Manager should have material.create" },
  { role: "manager", permission: "report.view.limited", expected: true, description: "Manager should have report.view.limited" },
  { role: "manager", permission: "user.delete", expected: false, description: "Manager should NOT have user.delete (only admin)" },
];

function runTests() {
  console.log("=== RBAC Validation Report ===\n");
  let passed = 0;
  let failed = 0;

  testCases.forEach((tc, index) => {
    const user = { role: tc.role };
    const result = hasPermission(user, tc.permission);
    const isOk = result === tc.expected;

    if (isOk) {
      console.log(`[PASS] Case #${index + 1}: ${tc.description}`);
      passed++;
    } else {
      console.error(`[FAIL] Case #${index + 1}: ${tc.description}`);
      console.error(`       Expected: ${tc.expected}, Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  
  if (failed === 0) {
    console.log("\n✅ RBAC logic is consistent with the mapping.");
  } else {
    console.error("\n❌ RBAC logic has DISCREPANCIES!");
    process.exit(1);
  }
}

runTests();
