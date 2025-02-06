import Joi from "joi";
const selectedCategory = {
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const postCategory = {
    body: Joi.object()
        .keys({
        kategori_nama: Joi.string().trim().max(100).required()
    })
        .options({ stripUnknown: true })
};
const putCategory = {
    body: Joi.object()
        .keys({
        kategori_nama: Joi.string().trim().max(100).required()
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const patchCategory = {
    body: Joi.object()
        .keys({
        kategori_nama: Joi.string().trim().max(100)
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const destroyCategory = {
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
export default { selectedCategory, postCategory, putCategory, patchCategory, destroyCategory };
