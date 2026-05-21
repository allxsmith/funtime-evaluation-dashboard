import tailwind from "bun-plugin-tailwind";
import { rm } from "node:fs/promises";

const isPages = process.env.GITHUB_PAGES === "true";
const publicPath = isPages ? "/funtime-evaluation-dashboard/" : "/";

await rm("./dist", { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "linked",
  publicPath,
  plugins: [tailwind],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Built ${result.outputs.length} files to dist/`);
