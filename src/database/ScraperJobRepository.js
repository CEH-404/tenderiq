import DatabaseManager from "./DatabaseManager.js";

const DATABASE_TABLE = "scraper_jobs";

class ScraperJobRepository {

    constructor(db) {

        this.db = db;

    }

    async createJob(jobId = null) {

        const id = jobId || `job_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        await this.db.query(

            `INSERT INTO ${DATABASE_TABLE} (job_id, status, current_stage, created_at, updated_at)
             VALUES ($1, 'queued', 'job_creation', NOW(), NOW())
             ON CONFLICT (job_id) DO UPDATE
             SET status = 'queued', current_stage = 'job_creation', updated_at = NOW()`,

            [id]

        );

        return id;

    }

    async getJobById(jobId) {

        const result = await this.db.query(

            `SELECT * FROM ${DATABASE_TABLE} WHERE job_id = $1`,

            [jobId]

        );

        return result[0] || null;

    }

    async claimNextJob(workerId) {

        const result = await this.db.transaction(async (client) => {

            const jobResult = await client.query(

                `SELECT id, job_id, status, current_stage, created_at, updated_at
                 FROM ${DATABASE_TABLE}
                 WHERE status = 'queued'
                 ORDER BY created_at
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1`

            );

            const job = jobResult.rows[0];

            if (!job) {

                return null;

            }

            await client.query(

                `UPDATE ${DATABASE_TABLE}
                 SET status = 'running',
                     current_stage = 'job_claimed',
                     worker_id = $1,
                     started_at = NOW(),
                     updated_at = NOW()
                 WHERE job_id = $2`,

                [workerId, job.job_id]

            );

            return job;

        });

        return result;

    }

    async updateJobStatus(jobId, status, currentStage = null) {

        const setParts = ["status = $1"];

        const values = [status];

        if (currentStage) {

            setParts.push(`current_stage = $${setParts.length}`);

            values.push(currentStage);

        }

        setParts.push(`updated_at = NOW()`);

        const sql = `UPDATE ${DATABASE_TABLE} SET ${setParts.join(", ")} WHERE job_id = $${values.length}`;

        values.push(jobId);

        await this.db.query(sql, values);

    }

    async updateJobProgress(jobId, recordsFound, recordsProcessed) {

        await this.db.query(

            `UPDATE ${DATABASE_TABLE}
             SET records_found = $1,
                 records_processed = $2,
                 updated_at = NOW()
             WHERE job_id = $3`,

            [recordsFound, recordsProcessed, jobId]

        );

    }

    async completeJob(jobId) {

        await this.db.query(

            `UPDATE ${DATABASE_TABLE}
             SET status = 'completed',
                 current_stage = 'completed',
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE job_id = $1`,

            [jobId]

        );

    }

    async failJob(jobId, errorMessage, errorStack) {

        await this.db.query(

            `UPDATE ${DATABASE_TABLE}
             SET status = 'failed',
                 current_stage = 'failed',
                 error_message = $1,
                 error_stack = $2,
                 failed_at = NOW(),
                 updated_at = NOW()
             WHERE job_id = $3`,

            [errorMessage, errorStack, jobId]

        );

    }

    async recoverStaleJobs(staleThresholdMs = 600000) {

        const cutoff = new Date(Date.now() - staleThresholdMs);

        await this.db.query(

            `UPDATE ${DATABASE_TABLE}
             SET status = 'queued',
                 current_stage = 'job_creation',
                 worker_id = NULL,
                 started_at = NULL,
                 updated_at = NOW()
             WHERE status IN ('running', 'scraping', 'processing', 'storing')
             AND updated_at < $1`,

            [cutoff]

        );

    }

    async heartbeatJob(jobId, workerId) {

        await this.db.query(

            `UPDATE ${DATABASE_TABLE}
             SET updated_at = NOW()
             WHERE job_id = $1
             AND worker_id = $2
             AND status IN ('running', 'scraping', 'processing', 'storing')`,

            [jobId, workerId]

        );

    }

}

export default ScraperJobRepository;