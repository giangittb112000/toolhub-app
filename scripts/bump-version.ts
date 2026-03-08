import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const type = process.argv[2] as "patch" | "minor" | "major";
if (!["patch", "minor", "major"].includes(type)) {
  console.error("Usage: bun run scripts/bump-version.ts [patch|minor|major]");
  process.exit(1);
}

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

const next = {
  patch: `${major}.${minor}.${patch + 1}`,
  minor: `${major}.${minor + 1}.0`,
  major: `${major + 1}.0.0`,
}[type]!;

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Version bumped → ${next}`);
