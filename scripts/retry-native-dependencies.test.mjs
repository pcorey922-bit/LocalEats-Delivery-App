import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp,writeFile,readFile,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const script=fileURLToPath(new URL("./retry-native-dependencies.sh",import.meta.url));
test("native dependency retries recover transient 504s, preserve compiler failures and bound persistent outages",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"rocoeats-native-retry-"));
  try {
    for(const [name,message,successAt,exitCode,expectedAttempts,expectedStatus] of [
      ["transient","badResponseStatusCode(504)",2,74,2,0],
      ["compiler","Compilation failed: incompatible API",100,7,1,7],
      ["outage","Server returned HTTP response code: 503",100,74,3,74],
    ]){
      const state=join(directory,name+".count"),command=join(directory,name+".mjs");
      await writeFile(command,`import fs from 'node:fs';const file=process.env.STATE_FILE;const count=fs.existsSync(file)?Number(fs.readFileSync(file,'utf8'))+1:1;fs.writeFileSync(file,String(count));if(count<${successAt}){console.error(${JSON.stringify(message)});process.exit(${exitCode});}console.log('Dependency available');`);
      const result=spawnSync("bash",[script,process.execPath,command],{encoding:"utf8",timeout:10000,env:{...process.env,STATE_FILE:state,ROCOEATS_NATIVE_RETRY_DELAY_SECONDS:"0"}});
      assert.equal(result.status,expectedStatus,result.stdout+result.stderr);
      assert.equal(Number(await readFile(state,"utf8")),expectedAttempts);
    }
  }finally{await rm(directory,{recursive:true,force:true});}
});
