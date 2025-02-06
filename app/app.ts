import express, { Application } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { logHTTP } from "@utils/logger";
import corsOptions from "~/configs/cors.js";
import routes from "~/routes/routes";
import error from "@middlewares/error";
import rateLimiter from "@middlewares/rateLimiter.js";

const app: Application = express();

app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "trusted-scripts.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"]
        }
    })
);
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

// Other middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(express.static("public"));
app.use(compression({ threshold: 1024 }));
app.use(logHTTP);

// Routing
app.use("/api", routes);

// API error handler
app.use(error.notFound);
app.use(error.handler);

export default app;
