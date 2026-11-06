import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory))
  throw new Error("Pass an absolute fixture output directory");
await mkdir(directory, { recursive: true });
await build({
  entryPoints: [
    new URL("../../localeats/tests/cart-browser.tsx", import.meta.url).pathname,
  ],
  bundle: true,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  outfile: path.join(directory, "cart-browser.js"),
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env": "{}" },
});
await writeFile(
  path.join(directory, "cart-browser.html"),
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>RoCoEats cart verification</title><style>body{font-family:system-ui;background:#f5f4ef;color:#142f49;padding:20px}main{max-width:650px;margin:auto}label{display:block;margin:12px 0}textarea{display:block;width:90%;min-height:50px}button,select{padding:10px;margin:8px 0}fieldset{margin:20px 0;border:1px solid #bdc8d1}li{margin:15px 0}</style></head><body><div id="root"></div><script type="module" src="./cart-browser.js"></script></body></html>',
);
