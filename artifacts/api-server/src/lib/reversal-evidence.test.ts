import {test} from 'node:test';import assert from 'node:assert/strict';import {verifiedReversalReceipt} from './reversal-evidence';
const expected={amountCents:1800,transferId:'tr_fixture',orderId:'order_fixture',operationId:'reversal:fixture'};
const good={id:'trr_fixture',amount:1800,currency:'usd',transfer:'tr_fixture',metadata:{orderId:expected.orderId,operationId:expected.operationId}};
test('only exact full reversal evidence is accepted, including expanded TEST transfer identity',()=>{
 assert.deepEqual(verifiedReversalReceipt(good,expected),{id:'trr_fixture',status:'succeeded'});
 assert.deepEqual(verifiedReversalReceipt({...good,transfer:{id:'tr_fixture',livemode:false}},expected),{id:'trr_fixture',status:'succeeded'});
});
test('partial, wrong-currency, foreign, live, missing or ambiguous reversal evidence is held without inventing recovery',()=>{
 for(const value of [null,{}, {...good,id:''},{...good,id:'tr_wrong'},{...good,amount:1799},{...good,amount:'1800'},{...good,currency:'eur'},{...good,transfer:'tr_other'},{...good,livemode:true},{...good,transfer:{id:'tr_fixture',livemode:true}},{...good,metadata:{orderId:'other',operationId:expected.operationId}},{...good,metadata:{orderId:expected.orderId,operationId:'other'}},{...good,metadata:undefined}]) assert.throws(()=>verifiedReversalReceipt(value,expected),(e:any)=>e.status===409 && e.requiresReconciliation===true);
 assert.throws(()=>verifiedReversalReceipt(good,{...expected,amountCents:NaN}));
});
