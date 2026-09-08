import { timingSafeEqual } from "crypto";

import logger from "../logger/Logger.js";

/**
 * Middleware to verify the scraper trigger secret.
 *
 * Expects Authorization header: Bearer <SCRAPER_TRIGGER_SECRET>
 *
 * The SCRAPER_TRIGGER_SECRET should be set in the environment.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * Returns true if the secret matches, false otherwise.
 */
export function verifyTriggerAuth(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {

        logger.warning("Missing or malformed Authorization header.");

        return res.status(401).json({

            success: false,

            message: "Unauthorized: missing or malformed Authorization header."

        });

    }

    const providedToken = authHeader.substring("Bearer ".length);

    const expectedToken = process.env.SCRAPER_TRIGGER_SECRET;

    if (!expectedToken) {

        logger.error(
            "SCRAPER_TRIGGER_SECRET not configured in environment."
        );

        return res.status(500).json({

            success: false,

            message: "Internal server error: trigger secret not configured."

        });

    }

    // Constant-time comparison to prevent timing attacks
    const secretMatch = timingSafeEqual(
        Buffer.from(providedToken, "utf8"),
        Buffer.from(expectedToken, "utf8")
    );

    if (!secretMatch) {

        logger.warning("Invalid scraper trigger secret provided.");

        return res.status(401).json({

            success: false,

            message: "Unauthorized: invalid trigger secret."

        });

    }

    // Attach the job repo or other context if needed
    req.triggerSecret = expectedToken;

    next();

}