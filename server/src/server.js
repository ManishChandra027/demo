import "dotenv/config";

import app from "./app.js";
import connectDb from "./db/index.js";
import { validateEnvironment } from "./config/env.js";
import { logInfo, logServiceError } from "./utils/logger.js";
import mongoose from "mongoose";

const startServer = async () => {
    const { port } = validateEnvironment();
    await connectDb();

    // const server = app.listen(port, () => logInfo("server.listening", { port }));

    // const shutdown = (signal) => {
    //     logInfo("server.shutdown_started", { signal });
    //     server.close(() => process.exit(0));
    //     setTimeout(() => process.exit(1), 10_000).unref();
    // };

    // process.once("SIGINT", () => shutdown("SIGINT"));
    // process.once("SIGTERM", () => shutdown("SIGTERM"));
    const server = app.listen(port, () => {
        logInfo("server.listening", { port });
    });

    const shutdown = (signal) => {
        logInfo("server.shutdown_started", { signal });

        server.close(async () => {
            try {
                await mongoose.connection.close();

                logInfo("server.shutdown_completed", { signal });
                process.exit(0);
            } catch (error) {
                logServiceError("server.shutdown_failed", error);
                process.exit(1);
            }
        });

        setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
    logServiceError("server.start_failed", error);
    process.exitCode = 1;
});
