/**
 * PostgreSQL Advisory Lock Service
 *
 * Ensures only ONE global scraper job can execute at a time across
 * all worker processes. Uses a session-level advisory lock so the lock
 * is automatically released when the worker process exits, even if it
 * crashes mid-job.
 *
 * Policy:
 *   - A dedicated PostgreSQL connection acquires the lock at job start
 *   - The lock is released in a finally block after job completion/failure
 *   - If the lock is unavailable, the job stays queued and Playwright
 *     is never launched
 *   - Lock key is a stable numeric constant, NOT the job ID
 * ------------------------------------------------------------------
 * Does NOT:
 *   - Use pg_advisory_xact_lock (lock would release at transaction end,
 *     which would require contained transaction lifecycle)
 *   - Use the job ID as the lock key (would allow one scrape per job)
 *   - Require Redis or external coordination
 */

/**
 * Stable numeric lock key — documented in code.
 * Changed only if you intentionally want to allow concurrent scrapes.
 */
export const SCRAPER_ADVISORY_LOCK_KEY = 1234567890;

/**
 * Acquire the global scraper advisory lock.
 *
 * Must be called with a dedicated pg Pool client (i.e. a connection
 * obtained via pool.connect() that is NOT returned to the pool until
 * the lock is released).
 *
 * Returns true if the lock was acquired, false if another worker
 * process already holds it.
 *
 * The caller MUST release the lock in a finally block, AND release
 * the client back to the pool.
 *
 * Example:
 *   const client = await pool.connect();
 *   try {
 *       const acquired = await acquireGlobalLock(client);
 *       if (!acquired) {
 *           // Another worker is scraping — don't start Playwright
 *           return false;
 *       }
 *       // Process the job...
 *   } finally {
 *       releaseGlobalLock(client);
 *   }
 */
export async function acquireGlobalLock(client) {

    const acquired =
        await client.query(

            "SELECT pg_try_advisory_lock($1)",

            [SCRAPER_ADVISORY_LOCK_KEY]

        );

    return acquired.rows[0].pg_try_advisory_lock;

}

/**
 * Release the global scraper advisory lock.
 *
 * Must be called for the same client that acquired the lock.
 * Safe to call even if the lock was never acquired.
 */
export function releaseGlobalLock(client) {

    client.query(

        "SELECT pg_advisory_unlock($1)",

        [SCRAPER_ADVISORY_LOCK_KEY]

    );

}