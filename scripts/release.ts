import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";


// ─── Config ────────────────────────────────────────────────────────────────────

const BUMP_TYPE = process.argv[2] as "patch" | "minor" | "major";
const VALID_TYPES = ["patch", "minor", "major"] as const;
const GIT_BRANCH = "main";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const run = (cmd: string): void => {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

const step = (label: string): void => {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`▶  ${label}`);
  console.log("─".repeat(50));
};

function hasGitChanges(): boolean {
  const result = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf-8",
  });
  return result.stdout.trim().length > 0;
}

function bumpVersion(pkgPath: string, type: "patch" | "minor" | "major"): void {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const [major, minor, patch] = pkg.version.split(".").map(Number);

  const next: Record<typeof type, string> = {
    patch: `${major}.${minor}.${patch + 1}`,
    minor: `${major}.${minor + 1}.0`,
    major: `${major + 1}.0.0`,
  };

  pkg.version = next[type];
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function readVersion(pkgPath: string): string {
  return JSON.parse(readFileSync(pkgPath, "utf-8")).version;
}

// ─── Validation ────────────────────────────────────────────────────────────────

if (!VALID_TYPES.includes(BUMP_TYPE)) {
  console.error(
    `❌ Invalid bump type: "${BUMP_TYPE}"\nUsage: bun run scripts/release.ts [patch|minor|major]`,
  );
  process.exit(1);
}

// ─── Pipeline ──────────────────────────────────────────────────────────────────

const pkgPath = join(process.cwd(), "package.json");

// Step 1: Bump version
step("1 / 3 — Bumping version");
bumpVersion(pkgPath, BUMP_TYPE);
const tag = `v${readVersion(pkgPath)}`;
console.log(`  ✅ Version bumped → ${tag} (read from package.json)`);

// Step 2: Push git changes (only if there are uncommitted changes)
step("2 / 3 — Committing & pushing to git");
if (hasGitChanges()) {
  run("git add .");
  run(`git commit -m "chore: release ${tag}"`);
  run(`git push origin ${GIT_BRANCH}`);
  console.log("  ✅ Changes pushed to GitHub");
} else {
  console.log("  ⚠️  No changes detected — skipping commit & push");
}

// Step 3: Create and push release tag
step("3 / 3 — Creating release tag");

// Check if tag already exists locally or remotely
const localTag = spawnSync("git", ["tag", "-l", tag], { encoding: "utf-8" });
if (localTag.stdout.trim() === tag) {
  console.error(`❌ Tag ${tag} already exists locally. Aborting.`);
  process.exit(1);
}

run(`git tag ${tag}`);
run(`git push origin ${tag}`);
console.log(`  ✅ Tag ${tag} pushed — GitHub release will be triggered`);

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(50)}`);
console.log(`🎉 Release ${tag} completed successfully!`);
console.log("═".repeat(50));
console.log(`\n🔗 GitHub Releases:`);
console.log(
  `   https://github.com/giangittb112000/toolhub-app/releases/tag/${tag}`,
);
