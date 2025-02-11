import env from "~/configs/env";
const origin = [env.FRONTEND_URL];
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const corsOptions = {
    origin,
    methods,
    preflightContinue: true,
    optionsSuccessStatus: 200,
    credentials: true,
    maxAge: 600
};
export default corsOptions;
