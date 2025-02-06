import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import rentalDetailController from "@controllers/rentalDetailController";
import rentalDetailValidation from "@validations/rentalDetailValidation";

const router = Router();

router.get("/", control(rentalDetailController.index));
router.get(
    "/:detailId",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalDetailValidation.selectedRentalDetail),
    control(rentalDetailController.selected)
);
router.post("/", middlewareHandler("auth"), sanitizeAndValidate(rentalDetailValidation.createRentalDetail), control(rentalDetailController.create));
router.put(
    "/:detailId",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalDetailValidation.updateRentalDetail),
    control(rentalDetailController.update)
);
router.patch(
    "/:detailId",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalDetailValidation.updateRentalDetail),
    control(rentalDetailController.update)
);
router.delete(
    "/:detailId",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalDetailValidation.destroyRentalDetail),
    control(rentalDetailController.destroy)
);
router.delete(
    "/:detailId/notrestoretoolstock",
    middlewareHandler("auth"),
    sanitizeAndValidate(rentalDetailValidation.destroyRentalDetail),
    control(rentalDetailController.destroyNotRestoreToolsStock)
);

export default router;
