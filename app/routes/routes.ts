import { Router } from "express";
import authRoute from "./v1/authRoute";
import categoryRoute from "./v1/categoryRoute";
import toolRoute from "./v1/toolRoute";
import customerRoute from "./v1/customerRoute";
import rentalRoute from "./v1/rentalRoute";
import customerDataRoute from "./v1/customerDataRoute";
import rentalDetailRoute from "./v1/rentalDetailRoute";

const router = Router();

router.use("/v1/auth", authRoute);
router.use("/v1/categories", categoryRoute);
router.use("/v1/tools", toolRoute);
router.use("/v1/customers", customerRoute);
router.use("/v1/data/customers", customerDataRoute);
router.use("/v1/rentals", rentalRoute);
router.use("/v1/detail/rentals", rentalDetailRoute);

export default router;
