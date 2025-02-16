import { Router } from "express";
import middlewareHandler from "@middlewares/_middleware";
import control from "@utils/control";
import sanitizeAndValidate from "~/src/validations/_validate";
import toolController from "@controllers/toolController";
import toolValidation from "@validations/toolValidation";
import { manyLoadFileInMemory, uploadFilesToS3 } from "~/src/services/fileService";

const router = Router();

router.get("/", control(toolController.index));
router.get("/:toolId", middlewareHandler("auth"), sanitizeAndValidate(toolValidation.selectedTool), control(toolController.selected));
router.post("/", middlewareHandler("auth"), sanitizeAndValidate(toolValidation.createTool), control(toolController.create));
router.put("/:toolId", middlewareHandler("auth"), sanitizeAndValidate(toolValidation.updateTool), control(toolController.update));
router.patch("/:toolId", middlewareHandler("auth"), sanitizeAndValidate(toolValidation.updateTool), control(toolController.update));
router.delete("/:toolId", middlewareHandler("auth"), sanitizeAndValidate(toolValidation.destroyTool), control(toolController.destroy));
router.delete("/gambar/:gambarId", middlewareHandler("auth"), control(toolController.deleteGambar));
router.post(
    "/:toolId/gambar",
    middlewareHandler("auth"),
    manyLoadFileInMemory(["gambar_utama", "gambar"]),
    uploadFilesToS3("alat", "gambar_utama"),
    uploadFilesToS3("alat", "gambar"),
    control(toolController.saveUploadFile)
);

export default router;
