import app from "./app";
import { processWebhookInbox } from "./lib/webhook-worker";
import { processFinancialOperation } from "./lib/financial-operations";
import { drainPushBatch } from "./lib/push";
import { paymentMode } from "./lib/commerce-policy";
paymentMode(); // Refuse live payment keys at startup.
let financeRunning=false;
const financeTimer=setInterval(async()=>{
 if(financeRunning||paymentMode()!=='stripe_test')return;
 financeRunning=true;
 try{for(let i=0;i<20;i++)if(!await processWebhookInbox())break;for(let i=0;i<10;i++)if(!await processFinancialOperation())break;}
 catch{logger.error('Financial worker failed; durable operations remain pending');}
 finally{financeRunning=false;}
},2000);
financeTimer.unref();
let pushRunning = false;
const pushTimer = setInterval(async () => {
  if (pushRunning) return;
  pushRunning = true;
  try {
    await drainPushBatch();
  } catch {
    logger.warn("Notification worker deferred");
  } finally {
    pushRunning = false;
  }
}, 15000);
pushTimer.unref();
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
