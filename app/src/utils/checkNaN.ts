import errorAPI from "./errorAPI";

export const checkNaN = (args: Record<string, unknown>) => {
    Object.entries(args).forEach(([key, value]) => {
        if (!value) {
            delete args[key];
        }
    });

    Object.values(args).forEach((value) => {
        if (isNaN(Number(value))) {
            throw new errorAPI("Beberapa value bukan angka", 400);
        }
    });

    return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, Number(value)]));
};
