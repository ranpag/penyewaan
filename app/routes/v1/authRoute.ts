import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import authController from "@controllers/authController";
import authValidation from "@validations/authValidation";

const router = Router();

router.post("/signup", middlewareHandler("guest"), sanitizeAndValidate(authValidation.signup), control(authController.signup));
router.post("/signin", middlewareHandler("guest"), sanitizeAndValidate(authValidation.signin), control(authController.signin));
router.get("/signout", middlewareHandler("auth"), control(authController.signout));
router.get("/refresh", control(authController.refresh));
router.patch(
    "/change-password",
    middlewareHandler("auth"),
    sanitizeAndValidate(authValidation.changePassword),
    control(authController.changePassword)
);
router.post("/forgot-password", middlewareHandler("guest"), sanitizeAndValidate(authValidation.forgotPassword), control(authController.forgotPassword));
router.patch("/reset-password/:token", middlewareHandler("guest"), sanitizeAndValidate(authValidation.resetPassword), control(authController.resetPassword));

export default router;
