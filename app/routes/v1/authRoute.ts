import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import authController from "@controllers/authController";
import authValidation from "@validations/authValidation";

const router = Router();

router.post("/signup", middlewareHandler("guest"), sanitizeAndValidate(authValidation.signup), control(authController.signup));
router.post("/signin", middlewareHandler("guest"), sanitizeAndValidate(authValidation.signin), control(authController.signin));
router.get("/refresh", control(authController.refresh));

export default router;
