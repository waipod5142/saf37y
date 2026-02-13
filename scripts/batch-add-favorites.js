#!/usr/bin/env node

/**
 * Batch add machine favorites for multiple users
 *
 * Edit the users array below to add favorites for multiple users at once
 */

const users = [
  // Add your users here in this format:
  // { userId: 'USER_ID', bu: 'vn', site: 'thiv' },
  // { userId: 'USER_ID', bu: 'th', site: 'sccc' },
  // Example (uncomment and modify):
  // { userId: 'DwfEM82kLdQOdqeEeNLdg9cuO1H3', bu: 'vn', site: 'thiv' },
  // { userId: 'ANOTHER_USER_ID', bu: 'th', site: 'sccc' },
];

if (users.length === 0) {
  console.log("⚠️  No users configured.");
  console.log(
    "\nEdit scripts/batch-add-favorites.js and add users to the array."
  );
  console.log("\nExample:");
  console.log("  const users = [");
  console.log('    { userId: "USER_ID", bu: "vn", site: "thiv" },');
  console.log('    { userId: "USER_ID", bu: "th", site: "scct" },');
  console.log("  ];");
  process.exit(0);
}

const apiUrl = process.env.API_URL || "http://localhost:3000";

console.log(`\n📝 Processing ${users.length} user(s)...\n`);

async function addFavoritesForUser(user, index) {
  console.log(
    `[${index + 1}/${users.length}] Processing: ${user.userId} (${user.bu}/${user.site})`
  );

  try {
    const response = await fetch(`${apiUrl}/api/add-favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`    ✅ Success! Added ${data.count} machines\n`);
      return { ...user, success: true, count: data.count };
    } else {
      console.log(`    ❌ Error: ${data.error || data.message}\n`);
      return { ...user, success: false, error: data.error || data.message };
    }
  } catch (error) {
    console.log(`    ❌ Request failed: ${error.message}\n`);
    return { ...user, success: false, error: error.message };
  }
}

async function processBatch() {
  const results = [];

  for (let i = 0; i < users.length; i++) {
    const result = await addFavoritesForUser(users[i], i);
    results.push(result);

    // Small delay between requests to avoid overwhelming the server
    if (i < users.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}`);
  successful.forEach((r) => {
    console.log(`   - ${r.userId} (${r.bu}/${r.site}): ${r.count} machines`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`   - ${r.userId} (${r.bu}/${r.site}): ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

processBatch();
