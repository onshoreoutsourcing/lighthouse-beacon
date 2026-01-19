#!/usr/bin/env node

/**
 * Lighthouse Hook Script for Claude Code Integration
 *
 * This script handles SessionStart and SessionEnd hooks from Claude Code.
 * It captures the session_id and transcript_path from stdin and writes them
 * to .lighthouse/events.jsonl for the Lighthouse extension to process.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Read JSON from stdin
    const stdinData = await readStdin();
    
    if (!stdinData) {
      console.error('[Lighthouse Hook] No data received from stdin');
      process.exit(1);
    }

    // Parse the JSON input
    let hookData;
    try {
      hookData = JSON.parse(stdinData);
    } catch (parseError) {
      console.error('[Lighthouse Hook] Failed to parse JSON from stdin:', parseError);
      process.exit(1);
    }

    // Validate hook event
    const hookEventName = hookData.hook_event_name;
    if (!hookEventName || !['SessionStart', 'SessionEnd'].includes(hookEventName)) {
      console.error(`[Lighthouse Hook] Unsupported hook event: ${hookEventName}`);
      process.exit(0); // Exit gracefully for other hook types
    }

    // Extract required fields
    const sessionId = hookData.session_id;
    const transcriptPath = hookData.transcript_path;

    if (!sessionId || !transcriptPath) {
      console.error('[Lighthouse Hook] Missing required fields: session_id or transcript_path');
      process.exit(1);
    }

    // Create event object for Lighthouse
    const lighthouseEvent = {
      type: hookEventName,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      transcript_path: transcriptPath,
      cwd: hookData.cwd || process.cwd(),
      source: hookData.source,
      reason: hookData.reason,
    };

    // Write to events file
    const eventsFile = path.join(process.cwd(), '.lighthouse', 'events.jsonl');

    // Ensure lighthouse directory exists
    const lighthouseDir = path.dirname(eventsFile);
    if (!fs.existsSync(lighthouseDir)) {
      fs.mkdirSync(lighthouseDir, { recursive: true });
    }

    // Append event to file (one event per line)
    const eventLine = JSON.stringify(lighthouseEvent) + '\n';
    fs.appendFileSync(eventsFile, eventLine, 'utf8');

    console.log(`[Lighthouse Hook] ${hookEventName} event captured successfully`);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('[Lighthouse Hook] Error:', error);
    process.exit(1);
  }
}

/**
 * Read all data from stdin
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    process.stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    
    process.stdin.on('error', (error) => {
      reject(error);
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
      resolve('');
    }, 1000);
  });
}

// Run the main function
main().catch((error) => {
  console.error('[Lighthouse Hook] Fatal error:', error);
  process.exit(1);
});
