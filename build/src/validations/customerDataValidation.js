import Joi from "joi";
import { errorAPI } from "../utils/errorAPI.js";
const selectedCustomerData = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const createCustomerData = {
    body: Joi.object()
        .keys({
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true })
};
const customerDataValidation = (pelanggan_data_jenis, pelanggan_data_file) => {
    if (pelanggan_data_jenis && (!pelanggan_data_file || pelanggan_data_file.length === 0)) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_jenis] without its required peers [pelanggan_data_file]']);
    }
    if (!pelanggan_data_jenis && pelanggan_data_file && pelanggan_data_file.length > 0) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_file] without its required peers [pelanggan_data_jenis]']);
    }
};
const putCustomerData = {
    body: Joi.object()
        .keys({
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const patchCustomerData = {
    body: Joi.object()
        .keys({
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const destroyCustomerData = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
export default { selectedCustomerData, createCustomerData, customerDataValidation, putCustomerData, patchCustomerData, destroyCustomerData };
