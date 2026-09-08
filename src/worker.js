import "dotenv/config";

import Framework from "./core/Framework.js";
import ScraperEngine from "./core/ScraperEngine.js";
import DatabaseManager from "./database/DatabaseManager.js";
import ScraperJobRepository from "./database/ScraperJobRepository.js";
import * as AdvisoryLock from "./database/AdvisoryLock.js";

import logger from "./logger/Logger.js";

import dotenv from "dotenv";

// Suppress noisy deprecation warnings from some dependencies
process.noDeprecation = true;

const WORKER_POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS || 5000);

const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS || 30000);

const STALE_THRESHOLD_MS = Number(process.env.STALE_THRESHOLD_MS || 600000);

async function main() {

    logger.info("TenderIQ Scraper Worker Starting...");

    // 0. Graceful shutdown setup
    const shutdownInProgress = { value: false };

    const shutdown = async () => {

        if (shutdownInProgress.value) {

            return;

        }

        shutdownInProgress.value = true;

        logger.info("SIGTERM/SIGINT received: initiating graceful shutdown...");

        // Stop the polling loop by throwing or breaking context
        // We'll set a flag and the while loop will check it

    };

    const signals = ["SIGTERM", "SIGINT"];

    for (const signal of signals) {

        process.on(signal, async () => {

            if (shutdownInProgress.value) {

                return;

            }

            shutdownInProgress.value = true;

            logger.info("SIGTERM/SIGINT received: initiating graceful shutdown...");

            // Stop the polling loop
            // The while loop will check shutdownInProgress.value on next iteration

            // If a job is in progress, safely requeue it (not "failed")
            // because shutdown is not necessarily a business failure.
            if (jobId) {

                try {

                    await jobRepo.updateJobStatus(

                        jobId,

                        "queued", // requeue, not fail

                        "job_creation"

                    );

                    logger.info(`Job ${jobId} requeued after shutdown signal`);

                } catch (e) {

                    logger.warning("Failed to requeue job after shutdown:", e);

                }

            }

            // That's it — the while loop will break on next iteration

        });

    // 1. Initialize configuration
    dotenv.config();

    const nodeEnv = process.env.NODE_ENV || "development";
    logger.info(`NODE_ENV: ${nodeEnv}`);

// 2. Initialize database
// Uses DATABASE_URL as the canonical PostgreSQL connection string
// DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME are no longer read
    const db = new DatabaseManager();
    await db.connect();

    const jobRepo = new ScraperJobRepository(db);

    logger.info("Database initialized. Waiting for jobs...");

    // Startup recovery: requeue any abandoned non-terminal jobs
    // (e.g. from kill -9, container restart, ungraceful shutdown)
    await jobRepo.recoverStaleJobs();

    logger.info("Stale job recovery complete. Waiting for new jobs...");

    // 3. Main polling loop
    while (true) {

        // Check if shutdown was signaled
        if (shutdownInProgress.value) {

            logger.info("Shutdown signal detected. Exiting worker loop.");

            // Release global lock if client is available
            // (The finally block in the job execution will also handle this,

            // but we do it here to ensure timely release.)

            break;

        }

    try {

    try {

        // 4. Claim next job (atomically: select queued job and mark running)
        const job = await jobRepo.claimNextJob(`worker-${process.pid}`);

        if (!job) {

            // No queued jobs — wait and poll again
            await new Promise((resolve) => setTimeout(resolve, WORKER_POLL_INTERVAL_MS));
            continue;

        }

        const jobId = job.job_id;

        logger.info(`Job claimed: ${jobId} (current_stage: ${job.current_stage})`);

        // 5. Acquire global scraper advisory lock
        let lockAcquired = false;
        let client = null;

        try {

            client = await db.pool.connect();

            lockAcquired = await AdvisoryLock.acquireGlobalLock(client);

            if (!lockAcquired) {

                logger.warning(
                    "Global scraper lock unavailable — another worker is " +
                    "currently scraping. Marking job back to queued."
                );

                await jobRepo.updateJobStatus(jobId, "queued");

                // Release the client back to the pool
                client.release();

                // Wait before retrying so we don't hammer the lock check
                await new Promise((resolve) => setTimeout(resolve, WORKER_POLL_INTERVAL_MS));

                continue;

            }

            logger.info("Global scraper lock acquired. Starting job processing...");

            // 6. Execute the existing scraper job
            await executeScraperJob(jobId, jobRepo, db);

            // 7. Job completed successfully
            await jobRepo.completeJob(jobId);

            logger.success(`Job completed: ${jobId}`);

        } catch (error) {

            logger.error(`Job failed: ${jobId}`, error);

            // Mark job as failed
            if (jobId) {

                await jobRepo.failJob(

                    jobId,

                    error.message,

                    error.stack

                );

            }

        } finally {

            // 8. Release global scraper advisory lock
            if (lockAcquired && client) {

                AdvisoryLock.releaseGlobalLock(client);

            }

            // Release client back to pool (if still connected)
            if (client) {

                client.release();

            }

        }

    } catch (error) {

        logger.error("Worker loop error:", error);

        // Brief backoff on unexpected errors
        await new Promise((resolve) => setTimeout(resolve, WORKER_POLL_INTERVAL_MS * 2));

    }

} catch (error) {

    logger.error("Worker loop fatal error:", error);

}}
}}