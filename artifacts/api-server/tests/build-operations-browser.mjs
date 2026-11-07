import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const directory=process.argv[2];
if(!directory||!path.isAbsolute(directory))throw new Error('Pass an absolute fixture output directory');
await mkdir(directory,{recursive:true});
await build({entryPoints:[new URL('../../localeats/tests/operations-browser.tsx',import.meta.url).pathname],bundle:true,platform:'browser',format:'esm',jsx:'automatic',outfile:path.join(directory,'operations-browser.js'),define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
await writeFile(path.join(directory,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>RoCoEats operational verification</title><style>body{font-family:system-ui;background:#f5f4ef;color:#142f49;padding:16px}main{max-width:720px;margin:auto}label{display:block;margin:12px 0}input,select,button{padding:10px;margin:8px 0;max-width:100%;box-sizing:border-box}form,article{border:1px solid #bdc8d1;padding:16px;margin:16px 0}a{display:block;padding:8px}</style></head><body><div id="root"></div><script type="module" src="./operations-browser.js"></script></body></html>');
