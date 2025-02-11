import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import env from "../../configs/env.js";
import errorAPI from "../utils/errorAPI.js";
import { Upload } from "@aws-sdk/lib-storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
const clientS3 = new S3Client({
    forcePathStyle: true,
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
});
export const uploadFileToS3 = (folder, fieldName) => async (req, res, next) => {
    const files = req.files;
    if (!files?.[fieldName]?.[0]) {
        return next();
    }
    const newFileName = uuidv4();
    const upload = new Upload({
        client: clientS3,
        params: {
            Bucket: env.AWS_BUCKET_NAME,
            Key: `${folder}/${newFileName}.${files?.[fieldName]?.[0]?.mimetype.split("/")[1]}`,
            Body: files?.[fieldName]?.[0]?.buffer,
            ContentType: files?.[fieldName]?.[0]?.mimetype
        }
    });
    try {
        await upload.done();
        req.body.pelanggan_data_file = `${env.OBJECT_URL}/${env.AWS_BUCKET_NAME}/${folder}/${newFileName}.${files?.[fieldName]?.[0]?.mimetype.split("/")[1]}`;
        next();
    }
    catch (err) {
        next(err);
    }
};
export const deleteFile = async (folder, fileName) => {
    const command = new DeleteObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: `${folder}/${fileName}`
    });
    await clientS3.send(command);
};
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/avif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        const error = new errorAPI("Unsupported Media Type", 415, {
            pelanggan_data_file: ["Invalid file format. Only PNG, JPG, JPEG, WEBP, and AVIF yang diperbolehkan."]
        });
        cb(error);
    }
};
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});
export const loadFileInMemory = (fieldName, moreValidation) => async (req, res, next) => {
    await new Promise((resolve, reject) => {
        memoryUpload.fields([{ name: fieldName, maxCount: 1 }])(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return reject(new errorAPI("Payload Too Large.", 413, {
                        pelanggan_data_file: ["File yang dikirim terlalu besar. Maximum size 5MB."]
                    }));
                }
            }
            else if (err) {
                return reject(err);
            }
            const files = req.files;
            const pelanggan_data_file = files?.[fieldName] ?? [];
            if (moreValidation) {
                try {
                    moreValidation(req.body.pelanggan_data_jenis, pelanggan_data_file);
                }
                catch (err) {
                    next(err);
                }
            }
            resolve();
        });
    }).catch(next);
    return next();
};
