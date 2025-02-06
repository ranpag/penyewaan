import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import categoryController from "@controllers/categoryController";
import categoryValidation from "@validations/categoryValidation";

const router = Router();

router.get("/", control(categoryController.index));
router.get("/:categoryId", middlewareHandler("auth"), sanitizeAndValidate(categoryValidation.selectedCategory), control(categoryController.selected));
router.post("/", middlewareHandler("auth"), sanitizeAndValidate(categoryValidation.createCategory), control(categoryController.create));
router.put("/:categoryId", middlewareHandler("auth"), sanitizeAndValidate(categoryValidation.updateCategory), control(categoryController.update));
router.patch("/:categoryId", middlewareHandler("auth"), sanitizeAndValidate(categoryValidation.updateCategory), control(categoryController.update));
router.delete(
    "/:categoryId",
    middlewareHandler("auth"),
    sanitizeAndValidate(categoryValidation.destroyCategory),
    control(categoryController.destroy)
);

export default router;
