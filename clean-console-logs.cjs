const fs = require("fs");
const path = require("path");

// Files to process based on the plan
const filesToProcess = [
  // Phase 1: Critical Files (75+ logs each)
  "src/components/games/note-recognition-games/MemoryGame.jsx",
  "src/components/games/notes-reading-games/MemoryGame.jsx",

  // Phase 1: Major Files (30-50 logs)
  "src/hooks/useAudioEngine.js",
  "src/components/games/rhythm-games/MetronomeTrainer.jsx",
  "src/components/games/shared/GameSettings.jsx",

  // Phase 2: Service Files (5-10 logs)
  "src/services/dashboardReminderService.js",
  "src/services/reminderService.js",

  // Phase 3: Minor Files (1-5 logs)
  "src/components/games/notes-reading-games/NotesReadingGame.jsx",
  "src/components/games/note-recognition-games/NoteRecognitionGame.jsx",
  "src/hooks/useDailyReminder.js",
  "src/components/games/rhythm-games/RhythmPatternGenerator.js",
];

function removeConsoleLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    // Pattern to match console.log(), console.debug(), console.info()
    // This handles:
    // 1. Single line: console.log("message");
    // 2. Multi-line: console.log(\n  "message"\n);
    // 3. With template literals, objects, etc.

    // Remove console.log statements (handles multi-line)
    content = content.replace(/console\.log\([^)]*\);?/gs, "");
    content = content.replace(/console\.log\([^;]*?\);/gs, "");

    // Handle multi-line console.log with nested parentheses
    let previousContent;
    do {
      previousContent = content;
      content = content.replace(
        /console\.log\([^()]*(?:\([^()]*\)[^()]*)*\);?/gs,
        ""
      );
    } while (content !== previousContent);

    // Remove console.debug statements
    content = content.replace(/console\.debug\([^)]*\);?/gs, "");
    do {
      previousContent = content;
      content = content.replace(
        /console\.debug\([^()]*(?:\([^()]*\)[^()]*)*\);?/gs,
        ""
      );
    } while (content !== previousContent);

    // Remove console.info statements
    content = content.replace(/console\.info\([^)]*\);?/gs, "");
    do {
      previousContent = content;
      content = content.replace(
        /console\.info\([^()]*(?:\([^()]*\)[^()]*)*\);?/gs,
        ""
      );
    } while (content !== previousContent);

    // Clean up excessive blank lines (more than 2 consecutive)
    content = content.replace(/\n\s*\n\s*\n+/g, "\n\n");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log("🧹 Starting console.log cleanup...\n");

let processedCount = 0;
let cleanedCount = 0;

filesToProcess.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    processedCount++;
    if (removeConsoleLogsFromFile(fullPath)) {
      cleanedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✨ Cleanup complete!`);
console.log(`📊 Processed: ${processedCount} files`);
console.log(`🧹 Cleaned: ${cleanedCount} files`);
console.log(`\n⚠️  Note: console.error() and console.warn() were preserved`);
