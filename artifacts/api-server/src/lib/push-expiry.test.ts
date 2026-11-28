import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationPushDeadline,pushLifetime,PushExpiredError} from './push-expiry';
test('push lifetime uses original creation time and never refreshes an old alert window',()=>{
  const created=new Date('2026-11-19T00:00:00Z'),deadline=notificationPushDeadline(created);
  assert.equal(deadline.getTime()-created.getTime(),300000);
  assert.deepEqual(pushLifetime(deadline,created.getTime()+120000),{ttlSeconds:180,expiresAtSeconds:Math.floor(deadline.getTime()/1000)});
  assert.equal(pushLifetime(undefined,created.getTime()).ttlSeconds,300);
  for(const now of [deadline.getTime()-500,deadline.getTime(),deadline.getTime()+1])assert.throws(()=>pushLifetime(deadline,now),PushExpiredError);
  assert.throws(()=>pushLifetime(new Date('invalid'),created.getTime()),PushExpiredError);
});
