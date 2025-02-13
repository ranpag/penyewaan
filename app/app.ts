import express, { Application, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { logger, logHTTP } from "@utils/logger";
import routes from "~/routes/routes";
import error from "@middlewares/error";
import rateLimiter from "@middlewares/rateLimiter.js";
import redocExpressMiddleware from "redoc-express";

const app: Application = express();

app.use(helmet());
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "'unsafe-inline'", "blob:"],
                "worker-src": ["'self'", "blob:"],
                imgSrc: ["'self'", "data:", "https://cdn.redoc.ly"]
            }
        }
    })
);

app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

// Other middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(rateLimiter);
app.use(express.static("public"));
app.use(compression({ threshold: 1024 }));
app.use(logHTTP);

app.get(
    "/docs",
    redocExpressMiddleware({
        title: "API Documentation",
        specUrl: "/openapi.yaml"
    })
);

app.get("/", (_req: Request, res: Response) => {
    res.send("Express on Vercel");
});

// Routing
app.use("/api", routes);

// API error handler
app.use(error.notFound);
app.use(error.handler);

app.listen(3000, () => {
    logger.info(`Server HTTP/1.1 berjalan di port 3000`);
});

export default app;
