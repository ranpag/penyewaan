import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import adminController from "@controllers/adminController";
import adminValidation from "@validations/adminValidation";

const router = Router();

router.get("/", middlewareHandler("auth"), control(adminController.index));
router.delete(
    "/:adminId",
    middlewareHandler("auth"),
    sanitizeAndValidate(adminValidation.destroyAdmin),
    control(adminController.destroy)
);

export default router;
