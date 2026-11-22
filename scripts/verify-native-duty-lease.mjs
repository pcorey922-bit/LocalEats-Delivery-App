import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(path.join(root,'artifacts/localeats/package.json'));
const dependency=path.dirname(require.resolve('@capacitor-community/background-geolocation/package.json'));
const source=path.join(dependency,'android/src/main/java/com/equimaps/capacitor_background_geolocation/DutyLease.java');
const core=path.dirname(require.resolve('@capacitor/android/package.json'));
const trace=path.join(core,'capacitor/src/main/java/com/getcapacitor/plugin/util/DutyTrace.java');
const output=await mkdtemp(path.join(tmpdir(),'roco-native-duty-'));
const java=process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin/java') : 'java';
function run(args){const r=spawnSync(java,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error('Native duty lease validation failed');}
try {
 run(['-m','jdk.compiler/com.sun.tools.javac.Main','-d',output,source,trace,path.join(root,'scripts/native-tests/DutyLeaseTest.java'),path.join(root,'scripts/native-tests/DutyTraceTest.java')]);
 run(['-cp',output,'DutyLeaseTest']);
 run(['-cp',output,'DutyTraceTest']);
} finally {await rm(output,{recursive:true,force:true});}
