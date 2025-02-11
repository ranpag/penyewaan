import errorAPI from "./errorAPI.js";
export const checkNaN = (args) => {
    Object.entries(args).forEach(([key, value]) => {
        if (!value) {
            delete args[key];
        }
    });
    Object.values(args).forEach((value) => {
        if (isNaN(Number(value))) {
            throw new errorAPI("Validation Error", 400, ["Beberapa value bukan angka"]);
        }
    });
    return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, Number(value)]));
};
