import { containerEnvironment } from "./container-environment.mjs";
Object.assign(process.env, containerEnvironment(process.env));
await import("../artifacts/api-server/dist/index.mjs");
