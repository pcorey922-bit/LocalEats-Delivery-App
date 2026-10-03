import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import dashboardRouter from "./dashboard";
import restaurantsRouter from "./restaurants";
import addressesRouter from "./addresses";
import ordersRouter from "./orders";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(dashboardRouter);
router.use(restaurantsRouter);
router.use(addressesRouter);
router.use(ordersRouter);
router.use(adminRouter);

export default router;
