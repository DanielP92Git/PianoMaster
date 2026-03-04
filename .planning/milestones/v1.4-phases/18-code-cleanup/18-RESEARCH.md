# Phase 18: Code Cleanup - Research

**Researched:** 2026-02-09
**Domain:** JavaScript/React dead code detection, dependency auditing, bundle optimization
**Confidence:** HIGH

## Summary

This phase focuses on systematically removing orphaned code, unused dependencies, and dead translation keys from the PianoApp2 codebase after completing all v1.4 feature phases. The standard approach combines multiple specialized tools (Knip, depcheck, i18next-cli) with manual verification and atomic git commits to ensure safe removal without breaking functionality.

The research confirms that `progressMigration.js` (240 lines, not 175 as documented) is truly orphaned - no code imports it, only planning documentation references it. Modern JavaScript tooling provides comprehensive dead code detection through ESLint plugins, static analysis tools like Knip, and bundle visualization with rollup-plugin-visualizer. The service worker already excludes JavaScript files from caching, so no celebration-related cache changes are needed.

The key recommendation is to use a multi-layered approach: automated detection tools identify candidates, manual verification confirms safety, atomic commits enable easy reversion, and bundle size comparison provides quantitative validation of impact.

**Primary recommendation:** Use Knip for project-wide dead code detection, depcheck for dependency auditing, i18next-cli for translation key cleanup, rollup-plugin-visualizer for bundle analysis, and atomic git commits for each logical removal to enable granular rollback.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Knip | Latest | Project-wide dead code detection | Builds comprehensive module graph to detect unused exports that ESLint misses; 100+ framework plugins including Vite, Vitest, React |
| depcheck | Latest | Unused npm dependency detection | Industry standard for analyzing package.json dependencies; detects unused, missing, and incorrectly specified dependencies |
| rollup-plugin-visualizer | 6.0.5 | Bundle size visualization | Official Rollup plugin for Vite; generates interactive treemap/sunburst charts showing module sizes |
| i18next-cli | Latest | Translation key extraction and cleanup | Official i18next tool for key extraction, code linting, and locale syncing; recommended for all i18next projects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-import | Latest | Detect unused modules via no-unused-modules rule | Augment ESLint for module-level detection within files |
| @lingual/i18n-check | Latest | Validate i18n files and find unused keys | Alternative to i18next-cli for focused translation validation |
| vite-bundle-analyzer | Latest | Alternative bundle analyzer | Use if rollup-plugin-visualizer doesn't meet needs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Knip | ts-prune + manual analysis | ts-prune is TypeScript-only; Knip works with JavaScript/TypeScript and has framework integrations |
| depcheck | npm-check | npm-check checks for outdated packages too, but less focused on dead code detection |
| rollup-plugin-visualizer | vite-bundle-visualizer | visualizer has more chart types and is the official Rollup solution |

**Installation:**
```bash
npm install -D knip rollup-plugin-visualizer
npm install -g depcheck i18next-cli
```

## Architecture Patterns

### Recommended Cleanup Workflow Structure
```
1. Discovery Phase
   ├── Run Knip for dead exports/files
   ├── Run depcheck for unused dependencies
   ├── Run i18next-cli for unused translation keys
   └── Generate baseline bundle analysis

2. Manual Verification Phase
   ├── Review each candidate for false positives
   ├── Check git history for context
   ├── Verify no dynamic imports or string references
   └── Document removal rationale

3. Atomic Removal Phase
   ├── One commit per logical unit
   │   ├── Single file removal
   │   ├── Single dependency removal
   │   └── Set of related translation keys
   ├── Descriptive commit messages
   └── Run tests after each commit

4. Validation Phase
   ├── Full test suite pass
   ├── Production build succeeds
   ├── Lint passes without warnings
   ├── Bundle size comparison
   └── Visual bundle analysis review
```

### Pattern 1: Atomic Git Commits for Safe Removal
**What:** Each logical removal (one file, one package, one set of translation keys) gets its own commit, enabling granular reversion without unwanted side effects.

**When to use:** Always when removing code during cleanup phases. Atomic commits are particularly valuable when the risk of breaking functionality exists.

**Example:**
```bash
# Commit 1: Remove orphaned migration file
git add src/utils/progressMigration.js
git commit -m "chore: remove orphaned progressMigration.js

File no longer imported anywhere after Phase 12 removed migration logic.
Line count: 240 lines
References: Only in planning documentation
Tests: No test coverage, no imports found

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Run tests
npm run test:run

# Commit 2: Remove unused dependency (separate commit)
git add package.json package-lock.json
git commit -m "chore: remove unused dependency 'example-lib'

Detected by depcheck. No imports found in codebase.
Bundle size reduction: ~45KB

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Pattern 2: Dead Code Detection with Knip
**What:** Knip analyzes the entire project module graph to find unused exports, files, and dependencies that ESLint cannot detect at the file level.

**When to use:** Primary tool for project-wide dead code audit. Run before manual cleanup begins.

**Example:**
```bash
# Add Knip configuration (optional, has sensible defaults)
# .knip.json or package.json "knip" field
{
  "entry": ["src/main.jsx"],
  "project": ["src/**/*.{js,jsx}"],
  "ignore": ["**/*.test.js", "scripts/**"]
}

# Run Knip
npx knip

# Output shows unused exports, files, dependencies:
# Unused files (1):
# src/utils/progressMigration.js
#
# Unused exports (3):
# src/services/oldService.js: export { legacyFunction }
```

### Pattern 3: Bundle Analysis for Before/After Comparison
**What:** Generate interactive visualizations of bundle composition to identify large modules and validate cleanup impact.

**When to use:** Before cleanup (baseline) and after cleanup (comparison) to quantify bundle size changes.

**Example:**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // Add as last plugin
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // or 'sunburst', 'network', 'flamegraph'
    })
  ]
});

// Build and generate stats
npm run build
# Opens dist/stats.html in browser
```

### Pattern 4: Translation Key Audit with i18next-cli
**What:** Extract all translation keys used in code and compare against locale files to find unused keys.

**When to use:** When auditing i18n files for dead translation keys.

**Example:**
```bash
# Extract keys from codebase
i18next extract --input 'src/**/*.{js,jsx}' \
  --output 'src/locales/extracted/{{lng}}/{{ns}}.json' \
  --locales 'en,he'

# Use i18n-check to find unused keys
npx @lingual/i18n-check -u src src/locales/en/translation.json

# Output:
# Unused keys in en/translation.json:
# - oldFeature.title
# - deprecatedButton.label
```

### Anti-Patterns to Avoid
- **Mass deletion without testing:** Removing multiple files/dependencies in one commit makes it hard to identify which change broke functionality.
- **Trusting automation blindly:** False positives exist (dynamic imports, string-based references). Always manually verify.
- **Skipping bundle analysis:** Without before/after metrics, you can't validate the cleanup had the intended impact.
- **Removing devDependencies arbitrarily:** Development tooling should only be removed if truly unused; focus on production dependencies for bundle impact.
- **Not checking git history:** A file may appear unused but could have been recently orphaned by a bug. Check commit history for context.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding unused exports across project | Grep-based script checking imports | Knip | Handles dynamic imports, re-exports, namespace imports, type imports; 100+ plugin integrations |
| Detecting unused dependencies | Manual package.json audit | depcheck | Accounts for devDependencies vs dependencies, special parsers for various file types, handles peer deps |
| Bundle size analysis | Parsing webpack stats manually | rollup-plugin-visualizer | Interactive visualizations, gzip/brotli sizes, treemap/sunburst views, official Rollup integration |
| Translation key cleanup | Regex search for t('key') | i18next-cli extract + i18n-check | Handles pluralization, namespaces, interpolation, context-specific keys |
| Dead CSS detection | Manual class name search | PurgeCSS (already in Tailwind) | Handles dynamic classes, whitelisting, content scanning |

**Key insight:** Modern JavaScript tooling has matured significantly. Static analysis tools like Knip can build comprehensive module graphs that catch edge cases (re-exports, barrel files, type-only imports) that manual approaches miss. Trust the tooling, but verify the results.

## Common Pitfalls

### Pitfall 1: False Positives from Dynamic Imports
**What goes wrong:** Dead code detection tools report a module as unused, but it's actually imported dynamically via string concatenation or runtime logic.

**Why it happens:** Static analysis cannot resolve dynamic import paths constructed at runtime (e.g., `import(`./modules/${name}.js`)`).

**How to avoid:**
- Manually grep for the filename in the codebase before removal
- Check for string literals matching the module name
- Review React.lazy() calls and route definitions
- Document any dynamic import patterns in .knip.json ignore rules

**Warning signs:**
- Module is in a "plugins" or "modules" directory structure
- Filename follows a convention pattern (e.g., `plugin-*.js`)
- Code has generic dynamic imports elsewhere in the codebase

### Pitfall 2: Removing Dependencies Still Required by Peer Dependencies
**What goes wrong:** depcheck reports a dependency as unused, but it's actually required as a peer dependency by another package you use.

**Why it happens:** depcheck analyzes direct imports but may not account for transitive peer dependency requirements.

**How to avoid:**
- Check package.json peerDependencies of all installed packages
- Test the build after removal before committing
- Review npm warnings during install for missing peer deps
- For Vite projects, check if the dependency is used in build tooling

**Warning signs:**
- Package is a popular peer dependency (e.g., react-dom for react-* libraries)
- Build fails immediately after removal with "cannot find module" errors
- npm install shows peer dependency warnings

### Pitfall 3: Breaking Service Worker Offline Functionality
**What goes wrong:** Removing code or changing cache strategy breaks offline functionality without immediate detection.

**Why it happens:** Service worker bugs only manifest in offline scenarios or after cache updates, which aren't tested in typical dev workflows.

**How to avoid:**
- Test offline mode explicitly after any service worker changes
- Use Chrome DevTools → Application → Service Workers → Offline checkbox
- Clear caches and hard reload to test fresh cache population
- Document service worker changes in commit messages

**Warning signs:**
- Changes to public/sw.js or cache-related code
- Removing files that might be pre-cached
- Modifying fetch interception logic

### Pitfall 4: i18n Key Removal Breaking Dynamic Translation Keys
**What goes wrong:** Translation keys appear unused in static analysis but are actually constructed dynamically (e.g., `t(`errors.${errorCode}`)`)

**Why it happens:** i18next-cli and similar tools use static analysis; runtime string concatenation is not detectable.

**How to avoid:**
- Search for template literals or string concatenation near t() calls
- Check for patterns like `t(\`${namespace}.${key}\`)` before removing keys
- Keep related key groups together even if some appear unused
- Document dynamic key patterns in code comments

**Warning signs:**
- Translation keys follow a pattern (e.g., `errors.404`, `errors.500`, etc.)
- Code has generic error handling or dynamic content loading
- Keys are organized in nested namespaces

### Pitfall 5: Atomic Commits Becoming Too Granular
**What goes wrong:** Creating separate commits for every single line change (e.g., one commit per translation key) creates noise in git history.

**Why it happens:** Overzealous interpretation of "atomic" commits.

**How to avoid:**
- Group related removals: all unused translation keys from one namespace in one commit
- Group by logical unit: remove a file and its imports together
- Aim for commits that are independently revertable without losing related context
- Use commit message body to list individual items if needed

**Warning signs:**
- Commit log has 50+ commits for a cleanup phase
- Each commit changes 1-2 lines
- Reverting one commit leaves orphaned references

## Code Examples

Verified patterns from official sources:

### Dead Code Detection with Knip
```bash
# Install Knip (dev dependency)
npm install -D knip

# Run Knip with default configuration
npx knip

# Run with specific entry points (for React apps)
npx knip --entry src/main.jsx --entry index.html

# Output example:
# Unused files (2)
# src/utils/progressMigration.js
# src/hooks/useOldFeature.js
#
# Unused exports (5)
# src/services/authService.js: oldLoginMethod
# src/utils/helpers.js: deprecatedFunction
#
# Unused dependencies (3)
# react-beautiful-dnd
# lodash-es
```
**Source:** [Knip Documentation](https://knip.dev/) - verified via WebSearch

### Dependency Audit with depcheck
```bash
# Install depcheck globally
npm install -g depcheck

# Run in project root
depcheck

# Output example:
# Unused dependencies
# * react-beautiful-dnd
# * lodash-es
# * moment
#
# Missing dependencies
# * @tanstack/react-query (used in src/hooks/useAuth.js)
#
# Invalid devDependencies
# * @vitejs/plugin-react (should be devDependency, is in dependencies)

# Custom configuration (.depcheckrc.json)
{
  "ignoreMatches": [
    "@fontsource/*",  // Font packages loaded via CSS
    "vite-plugin-*"    // Vite plugins loaded via config
  ],
  "ignorePatterns": [
    "dist",
    "build"
  ]
}
```
**Source:** [depcheck npm package](https://www.npmjs.com/package/depcheck) - verified via WebSearch

### Bundle Analysis Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Add as last plugin for accurate analysis
    visualizer({
      filename: 'dist/bundle-stats.html',
      open: false, // Don't auto-open in browser
      gzipSize: true, // Show gzip size (most relevant for production)
      brotliSize: true, // Show brotli size
      template: 'treemap', // Options: treemap, sunburst, network, flamegraph, list
      title: 'PianoApp2 Bundle Analysis'
    })
  ],
  build: {
    // Ensure source maps for debugging
    sourcemap: true,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000
  }
});

// After build, open dist/bundle-stats.html to view interactive chart
```
**Source:** [rollup-plugin-visualizer GitHub](https://github.com/btd/rollup-plugin-visualizer) - verified via WebSearch

### Translation Key Cleanup Workflow
```bash
# Using i18next-cli (official recommended tool)
# Install i18next-cli
npm install -g i18next-cli

# Extract keys from codebase
i18next extract \
  --input 'src/**/*.{js,jsx}' \
  --output 'temp-extracted/{{lng}}/{{ns}}.json' \
  --locales 'en,he'

# Compare with existing translations manually or use i18n-check
npm install -D @lingual/i18n-check

# Find unused keys
npx @lingual/i18n-check --unused src src/locales/en/translation.json

# Output:
# ✓ Checked 245 keys
# ✗ Found 12 unused keys:
#   - oldFeature.welcomeMessage
#   - deprecatedView.title
#   - removedButton.label
# ✓ No missing keys

# Alternative: Use i18next-scanner for automated removal
# .i18next-scanner.config.js
module.exports = {
  options: {
    removeUnusedKeys: true, // Set to true to remove unused keys
    sort: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx']
    }
  }
};
```
**Source:** [i18next-cli documentation](https://www.i18next.com/how-to/extracting-translations) and [@lingual/i18n-check](https://www.npmjs.com/package/@lingual/i18n-check) - verified via WebSearch

### Atomic Commit Pattern for File Removal
```bash
# Pattern: Remove single file with full context in commit message

# 1. Verify no imports
git grep -n "progressMigration" -- "*.js" "*.jsx"
# (should return no results in src/ directory)

# 2. Check file still exists
ls -lh src/utils/progressMigration.js
# -rw-r--r-- 1 user user 6.2K Feb 9 10:00 progressMigration.js

# 3. Remove file
git rm src/utils/progressMigration.js

# 4. Run tests to ensure no breakage
npm run test:run

# 5. Commit with detailed message
git commit -m "chore: remove orphaned progressMigration.js

Migration utility is no longer used after Phase 12 removed legacy
trail migration logic. All users have been migrated or had their
progress reset during v1.3 trail restructuring.

Evidence of orphan status:
- No imports found in src/ directory (verified with grep)
- Only referenced in .planning/ documentation files
- Removed from Dashboard.jsx in Phase 12 (commit 6d31055)

Impact:
- Line count: 240 lines removed
- No test coverage to update
- No bundle size impact (tree-shaken already)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Verify commit
git show --stat
```
**Source:** [Atomic Commits Best Practices](https://www.aleksandrhovhannisyan.com/blog/atomic-git-commits/) - verified via WebSearch

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual grep for unused imports | Knip project-wide analysis | 2023-2024 | Detects unused exports/files that grep misses; handles dynamic imports |
| webpack-bundle-analyzer | rollup-plugin-visualizer for Vite | 2020+ (Vite adoption) | Native Rollup integration, multiple visualization types, smaller footprint |
| i18next-scanner standalone | i18next-cli official tool | 2022+ | Official tool with better integration, type generation, locale syncing |
| Manual dependency audit | depcheck automated analysis | Established practice | Detects unused, missing, and misclassified dependencies automatically |
| Large multi-file commits | Atomic commits per logical unit | Modern git workflow | Easier rollback, clearer history, safer refactoring |

**Deprecated/outdated:**
- ts-prune for dead code: Still works but limited to TypeScript; Knip supports both JS/TS with framework plugins
- webpack-deadcode-plugin: Webpack-specific; use Knip for bundler-agnostic analysis
- Manual translation key audits: i18next-cli extract + i18n-check automate this workflow
- npm-check for unused deps: Still works but depcheck is more focused on dead code detection

## Open Questions

Things that couldn't be fully resolved:

1. **Service worker celebration caching strategy**
   - What we know: Phase 13 context mentioned "re-enabling" celebration caching, but service worker already excludes all JS files from caching (lines 173-176 in sw.js). Vite's content-hashed chunks ensure cache invalidation. No explicit celebration exclusion exists.
   - What's unclear: What specifically needs to be "re-enabled"? The context may reflect a misunderstanding.
   - Recommendation: Review service worker during cleanup for correctness and completeness, but no celebration-specific changes needed. Service worker already follows best practices (cache-first for static assets, network-first for API, excludes auth and JS).

2. **Single-use abstraction criteria**
   - What we know: Context says "Claude's discretion on single-use abstractions: inline where it simplifies, leave where the abstraction adds clarity"
   - What's unclear: Exact threshold for when to inline vs keep abstraction (complexity, lines of code, cognitive load)
   - Recommendation: Use heuristic: inline if abstraction is <10 lines AND only used once AND doesn't improve testability. Keep if abstraction improves readability even with single use (e.g., named functions for complex logic).

3. **Lighter alternative dependencies**
   - What we know: Context says "consider lighter alternatives if heavy bloat is found"
   - What's unclear: Which dependencies are candidates for replacement? Bundle analysis will reveal heavy modules, but evaluating "lighter alternatives" requires research per dependency.
   - Recommendation: Generate bundle analysis first, identify top 5 largest dependencies, then research alternatives only if they exceed 100KB gzipped and have well-known lighter alternatives.

## Sources

### Primary (HIGH confidence)
- [Knip Documentation](https://knip.dev/) - Official documentation for project-wide dead code detection
- [depcheck npm package](https://www.npmjs.com/package/depcheck) - Official npm package documentation
- [rollup-plugin-visualizer GitHub](https://github.com/btd/rollup-plugin-visualizer) - Official Rollup plugin repository
- [i18next-cli documentation](https://www.i18next.com/how-to/extracting-translations) - Official i18next tooling
- Codebase verification: src/utils/progressMigration.js exists with 240 lines, grep confirmed no imports

### Secondary (MEDIUM confidence)
- [Atomic Commits Best Practices](https://www.aleksandrhovhannisyan.com/blog/atomic-git-commits/) - Web article verified via WebSearch
- [Service Worker Caching Strategies](https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies) - PWA best practices article
- [@lingual/i18n-check npm](https://www.npmjs.com/package/@lingual/i18n-check) - Alternative i18n validation tool
- [Dead Code Detection - LogRocket](https://blog.logrocket.com/how-detect-dead-code-frontend-project/) - Frontend dead code detection overview

### Tertiary (LOW confidence)
- WebSearch results for "JavaScript dead code detection" - Multiple sources agree on Knip as current standard
- WebSearch results for "npm unused dependencies" - depcheck consistently recommended across sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Knip, depcheck, rollup-plugin-visualizer are industry-standard tools verified through official documentation and multiple sources
- Architecture: HIGH - Atomic commit pattern, bundle analysis workflow, and multi-tool approach are well-established best practices verified across multiple authoritative sources
- Pitfalls: MEDIUM - Based on general JavaScript/React knowledge and PWA best practices; specific pitfalls (dynamic imports, peer deps) are documented patterns but not verified in this codebase's specific context

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable domain, tooling changes slowly)
