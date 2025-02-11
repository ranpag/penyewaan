import { Router } from "express";
import authRoute from "./v1/authRoute";
import categoryRoute from "./v1/categoryRoute";
import toolRoute from "./v1/toolRoute";
import customerRoute from "./v1/customerRoute";
import rentalRoute from "./v1/rentalRoute";
import customerDataRoute from "./v1/customerDataRoute";
import rentalDetailRoute from "./v1/rentalDetailRoute";
import adminRoute from "./v1/adminRoute";

const router = Router();

router.use("/v1/auth", authRoute);
router.use("/v1/kategori", categoryRoute);
router.use("/v1/alat", toolRoute);
router.use("/v1/pelanggan", customerRoute);
router.use("/v1/data/pelanggan", customerDataRoute);
router.use("/v1/penyewaan", rentalRoute);
router.use("/v1/detail/penyewaan", rentalDetailRoute);
router.use("/v1/admin", adminRoute);

export default router;
