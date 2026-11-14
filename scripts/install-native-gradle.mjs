// Install only the wrapper-pinned official distribution. This avoids repeating
// Java wrapper redirect failures; version and vendor SHA remain authoritative.
import {readFile,mkdir,appendFile,rm} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
export function pinnedGradle(properties){
 const url=properties.match(/^distributionUrl=(.+)$/m)?.[1].replace(/\\:/g,':');
 const match=/^https:\/\/downloads\.gradle\.org\/distributions\/gradle-(\d+\.\d+\.\d+)-bin\.zip$/.exec(url||'');
 const sha=properties.match(/^distributionSha256Sum=([a-f0-9]{64})$/m)?.[1];
 if(!match||!sha)throw Error('Official Gradle version and SHA-256 pin required');
 return {url,sha,version:match[1]};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(!process.env.RUNNER_TEMP||!process.env.GITHUB_ENV)throw Error('Use a private runner temporary directory and GITHUB_ENV');
 const pin=pinnedGradle(await readFile(new URL('../artifacts/localeats/android/gradle/wrapper/gradle-wrapper.properties',import.meta.url),'utf8'));
 const root=join(process.env.RUNNER_TEMP,'rocoeats-official-gradle');await mkdir(root,{recursive:true});
 const archive=join(root,'distribution.zip');
 let completed=false;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(pin.url,{signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw Object.assign(Error('Official Gradle download failed'),{transient:[429,502,503,504].includes(response.status)});
   const hash=createHash('sha256');
   await pipeline(response.body,new Transform({transform(chunk,_enc,cb){hash.update(chunk);cb(null,chunk);}}),createWriteStream(archive,{mode:0o600}));
   if(hash.digest('hex')!==pin.sha)throw Error('Official Gradle checksum mismatch; refusing execution');
   completed=true;break;
  }catch(e){await rm(archive,{force:true});if(attempt===2||(!e.transient&&!['TimeoutError','TypeError'].includes(e.name)))throw Error('Pinned official Gradle download could not be verified');await new Promise(r=>setTimeout(r,5000*(attempt+1)));}
 }
 if(!completed)throw Error('Verified Gradle unavailable');
 const result=spawnSync('unzip',['-q','-o',archive,'-d',root],{stdio:'inherit'});await rm(archive,{force:true});
 if(result.status!==0)throw Error('Verified Gradle extraction failed');
 await appendFile(process.env.GITHUB_ENV,`ROCOEATS_GRADLE_BINARY=${join(root,`gradle-${pin.version}`,'bin','gradle')}\n`);
 console.log(`Installed official Gradle ${pin.version}; vendor SHA-256 verified. No mirror or TLS override.`);
}
