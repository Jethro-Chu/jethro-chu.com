#!/usr/bin/env node
/**
 * CLI utility to manage hospital suggestions for New Grad RN Tracker.
 *
 * Usage:
 *   npx tsx scripts/newgrad-suggestions.ts list [--status pending|processed|all]
 *   npx tsx scripts/newgrad-suggestions.ts complete <suggestion_id>
 *   npx tsx scripts/newgrad-suggestions.ts reject <suggestion_id>
 */

import { getAllSuggestions, updateSuggestionStatus } from "../lib/newgrad/suggestions.ts";

const args = process.argv.slice(2);
const command = args[0] || "list";

async function main() {
  switch (command) {
    case "list": {
      const statusFlagIndex = args.indexOf("--status");
      const statusFilter = statusFlagIndex >= 0 ? args[statusFlagIndex + 1] : "pending";

      const all = await getAllSuggestions();
      const filtered =
        statusFilter === "all"
          ? all
          : all.filter((s) => s.status === statusFilter);

      console.log(`\nNew Grad RN Tracker · Hospital Suggestions (${filtered.length} items):\n`);
      if (filtered.length === 0) {
        console.log(`  No ${statusFilter === "all" ? "" : statusFilter + " "}suggestions found.\n`);
        return;
      }

      for (const s of filtered) {
        console.log(`  [${s.status.toUpperCase()}] ID: ${s.id}`);
        console.log(`    Hospital: ${s.hospital_name}`);
        if (s.location) console.log(`    Location: ${s.location}`);
        if (s.url) console.log(`    URL:      ${s.url}`);
        if (s.notes) console.log(`    Notes:    ${s.notes}`);
        console.log(`    Date:     ${s.submitted_at}`);
        if (s.processed_at) console.log(`    Processed: ${s.processed_at}`);
        console.log("");
      }
      break;
    }

    case "complete": {
      const id = args[1];
      if (!id) {
        console.error("Error: missing suggestion ID. Usage: complete <id>");
        process.exit(1);
      }
      const ok = await updateSuggestionStatus(id, "processed");
      if (ok) {
        console.log(`Suggestion ${id} marked as PROCESSED.`);
      } else {
        console.error(`Suggestion ${id} not found.`);
        process.exit(1);
      }
      break;
    }

    case "reject": {
      const id = args[1];
      if (!id) {
        console.error("Error: missing suggestion ID. Usage: reject <id>");
        process.exit(1);
      }
      const ok = await updateSuggestionStatus(id, "rejected");
      if (ok) {
        console.log(`Suggestion ${id} marked as REJECTED.`);
      } else {
        console.error(`Suggestion ${id} not found.`);
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.log("Usage: npx tsx scripts/newgrad-suggestions.ts [list|complete|reject]");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error running suggestions CLI:", err);
  process.exit(1);
});
