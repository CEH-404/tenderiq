import mysql from "mysql2/promise";

import logger from "../logger/logger.js";

class DatabaseManager {

    constructor(config = {}) {

        this.config = {

            host:
                process.env.DB_HOST,

            port:
                process.env.DB_PORT || 3306,

            user:
                process.env.DB_USER,

            password:
                process.env.DB_PASSWORD,

            database:
                process.env.DB_NAME,

            waitForConnections: true,

            connectionLimit: 10,

            queueLimit: 0,

            ...config

        };

        this.pool = null;

    }

    async connect() {

        if (this.pool) {

            return this.pool;

        }

        this.pool =
            mysql.createPool(this.config);

        logger.success(
            "Database connected."
        );

        return this.pool;

    }

    async disconnect() {

        if (!this.pool) {

            return;

        }

        await this.pool.end();

        this.pool = null;

        logger.success(
            "Database disconnected."
        );

    }

    async query(sql, params = []) {

        if (!this.pool) {

            await this.connect();

        }

        const [rows] =
            await this.pool.execute(
                sql,
                params
            );

        return rows;

    }

    async transaction(callback) {

        if (!this.pool) {

            await this.connect();

        }

        const connection =
            await this.pool.getConnection();

        try {

            await connection.beginTransaction();

            const result =
                await callback(connection);

            await connection.commit();

            return result;

        }

        catch (error) {

            await connection.rollback();

            throw error;

        }

        finally {

            connection.release();

        }

    }

}

export default DatabaseManager;