import { freeStagingEnvironment, migrateFreeStaging } from "./free-staging.mjs";
Object.assign(process.env, freeStagingEnvironment(process.env));
await migrateFreeStaging(process.env);
await import("./start-container.mjs");
