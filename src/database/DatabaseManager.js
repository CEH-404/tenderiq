import { Pool } from "pg";

import logger from "../logger/Logger.js";

class DatabaseManager {

    constructor(config = {}) {

        this.config = {

            connectionString: process.env.DATABASE_URL,

            max: 10,

            idleTimeoutMillis: 30000,

            connectionTimeoutMillis: 15000,

            ...config

        };

        this.pool = null;

    }

    async connect() {

        if (this.pool) {

            return this.pool;

        }

        this.pool = new Pool(this.config);

        this.pool.on("connect", () => {

            logger.success("Database connected.");

        });

        this.pool.on("error", (err) => {

            // Log pool-level errors (e.g., connection failures) server-side
            // without exposing credentials to clients
            logger.error("Database pool error: ", { 
                message: err.message,
                code: err.code 
            });

        });

        this.pool.on("remove", () => {

            logger.success("Database connection released.");

        });

        return this.pool;

    }

    async disconnect() {

        if (!this.pool) {

            return;

        }

        await this.pool.end();

        this.pool = null;

        logger.success("Database disconnected.");

    }

    async query(sql, params = []) {

        if (!this.pool) {

            await this.connect();

        }

        const client = await this.pool.connect();

        try {

            const result = await client.query(sql, params);

            return result.rows;

        } catch (error) {

            // Log detailed database error server-side without exposing secrets
            logger.error("Database query error: ", { 
                message: error.message,
                code: error.code,
                // Only include detail/hint if they don't contain sensitive info
                detail: error.detail && !error.detail.includes(process.env.DATABASE_URL ? 'postgresql' : 'unknown'),
                hint: error.hint 
            });

            throw error;

        } finally {

            client.release();

        }

    }

    async transaction(callback) {

        if (!this.pool) {

            await this.connect();

        }

        const client = await this.pool.connect();

        try {

            await client.query("BEGIN");

            const result = await callback(client);

            await client.query("COMMIT");

            return result;

        } catch (error) {

            await client.query("ROLLBACK");

            throw error;

        } finally {

            client.release();

        }

    }

}

export default DatabaseManager;