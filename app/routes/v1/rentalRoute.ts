import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import rentalController from "@controllers/rentalController";
import rentalValidation from "@validations/rentalValidation";

const router = Router();

router.get("/", middlewareHandler("auth"), control(rentalController.index));
router.get("/:rentalId", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.selectedRental), control(rentalController.selected));
router.post("/", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.createRental), control(rentalController.create));
router.put("/:rentalId", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.updateRental), control(rentalController.update));
router.patch("/:rentalId", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.updateRental), control(rentalController.update));
router.delete("/:rentalId", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.destroyRental), control(rentalController.destroy));
router.delete(
    "/:rentalId/force",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalValidation.destroyRental),
    control(rentalController.destroyNotRestoreToolsStock)
);
router.post("/:rentalId/selesai", middlewareHandler("auth"), sanitizeAndValidate(rentalValidation.selectedRental), control(rentalController.clear));

export default router;
