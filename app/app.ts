import express, { Application } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { logHTTP } from "@utils/logger";
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
                scriptSrc: ["'self'", "https://unpkg.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
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

app.use("/openapi.yaml", express.static("./storages/openapi.yaml"));

app.get(
    "/docs",
    redocExpressMiddleware({
        title: "API Documentation",
        specUrl: "/openapi.yaml"
    })
);

// Routing
app.use("/api", routes);

// API error handler
app.use(error.notFound);
app.use(error.handler);

export default app;
