#!/usr/bin/env node

// curl -X POST http://localhost:3000/api/add-favorites \
//   -H "Content-Type: application/json" \
//   -d '{"userId":"DwfEM82kLdQOdqeEeNLdg9cuO1H3","bu":"vn","site":"thiv"}'

/**
 * Helper script to add machine favorites for a user
 *
 * Usage:
 *   node scripts/add-favorites-helper.js <userId> <bu> <site>
 *
 * Example:
 *   node scripts/add-favorites-helper.js DwfEM82kLdQOdqeEeNLdg9cuO1H3 vn thiv
 */

// http://localhost:3000/admin/add-favorites

const userId = process.argv[2];
const bu = process.argv[3];
const site = process.argv[4];

if (!userId || !bu || !site) {
  console.error("❌ Missing required arguments");
  console.log("\nUsage:");
  console.log("  node scripts/add-favorites-helper.js <userId> <bu> <site>");
  console.log("\nExample:");
  console.log(
    "  node scripts/add-favorites-helper.js DwfEM82kLdQOdqeEeNLdg9cuO1H3 vn thiv"
  );
  process.exit(1);
}

const apiUrl = process.env.API_URL || "http://localhost:3000";

console.log(`\n📝 Adding favorites for:`);
console.log(`   User ID: ${userId}`);
console.log(`   BU: ${bu}`);
console.log(`   Site: ${site}`);
console.log(`   API: ${apiUrl}/api/add-favorites\n`);

fetch(`${apiUrl}/api/add-favorites`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId, bu, site }),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log(`✅ Success! Added ${data.count} machines to favorites`);
      console.log(`\nYou can view them at: ${apiUrl}/account/my-favourites`);
    } else {
      console.error("❌ Error:", data.error || data.message);
    }
  })
  .catch((error) => {
    console.error("❌ Request failed:", error.message);
    process.exit(1);
  });
