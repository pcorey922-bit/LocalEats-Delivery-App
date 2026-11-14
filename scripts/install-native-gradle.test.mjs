import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {pinnedGradle} from './install-native-gradle.mjs';
test('native Gradle installer accepts only official pinned binary distributions',async()=>{
 const text=await readFile(new URL('../artifacts/localeats/android/gradle/wrapper/gradle-wrapper.properties',import.meta.url),'utf8');const pin=pinnedGradle(text);assert.equal(pin.version,'8.14.3');assert.equal(pin.sha.length,64);
 for(const body of [text.replace('downloads.gradle.org','evil.example.test'),text.replace('https\\:','http\\:'),text.replace(/distributionSha256Sum=.*/,''),text.replace('-bin.zip','-all.zip')])assert.throws(()=>pinnedGradle(body));
});
