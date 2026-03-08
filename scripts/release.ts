import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf-8"),
);
const version = pkg.version;
const tag = `v${version}`;

const run = (cmd: string) => {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

console.log(`\n🚀 Releasing ${tag}...\n`);

run(`git add package.json`);
run(`git commit -m "chore: release ${tag}"`);
run(`git push origin main`);
run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(`\n✅ Tag ${tag} đã được push lên GitHub!`);
console.log(`\n📦 Bước tiếp theo:`);
console.log(`  1. Build:   bun run package:mac`);
console.log(
  `  2. Upload:  https://github.com/giangittb112000/toolhub-app/releases/new?tag=${tag}`,
);
