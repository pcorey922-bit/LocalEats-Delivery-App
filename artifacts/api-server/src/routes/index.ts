import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import dashboardRouter from "./dashboard";
import restaurantsRouter from "./restaurants";
import addressesRouter from "./addresses";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import driversRouter from "./drivers";

import commerceRouter from "./commerce";

import dispatchRouter from "./dispatch";
import operationalHealthRouter from "./operational-health";
const router: IRouter = Router();

router.use(healthRouter);
router.use(commerceRouter);
router.use(operationalHealthRouter);
router.use(dispatchRouter);
router.use(profilesRouter);
router.use(dashboardRouter);
router.use(restaurantsRouter);
router.use(addressesRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(driversRouter);

export default router;
