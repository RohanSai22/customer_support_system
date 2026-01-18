import { MiddlewareHandler } from "hono";
import { db, rateLimits } from "@repo/db";
import { eq, and, gte } from "drizzle-orm";

const USER_LIMIT = 10; // messages per minute
const IP_LIMIT = 20; // messages per minute
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Rate limiting middleware
 * Implements both per-user and per-IP rate limiting
 */
export const rateLimiter: MiddlewareHandler = async (c, next) => {
  try {
    const body = await c.req.json();
    const userId = body.userId;
    const ip =
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    // Check user rate limit
    if (userId) {
      const userLimit = await db.query.rateLimits.findFirst({
        where: and(
          eq(rateLimits.identifier, userId),
          eq(rateLimits.type, "user"),
          gte(rateLimits.windowStart, windowStart),
        ),
      });

      if (userLimit && userLimit.count >= USER_LIMIT) {
        return c.json(
          {
            error: "Rate limit exceeded",
            message: `You can only send ${USER_LIMIT} messages per minute. Please wait.`,
          },
          429,
        );
      }

      // Update or create user limit
      if (userLimit) {
        await db
          .update(rateLimits)
          .set({ count: userLimit.count + 1, updatedAt: now })
          .where(eq(rateLimits.id, userLimit.id));
      } else {
        // Clean old entries
        await db
          .delete(rateLimits)
          .where(
            and(eq(rateLimits.identifier, userId), eq(rateLimits.type, "user")),
          );

        // Create new entry
        await db.insert(rateLimits).values({
          identifier: userId,
          type: "user",
          count: 1,
          windowStart: now,
        });
      }
    }

    // Check IP rate limit
    const ipLimit = await db.query.rateLimits.findFirst({
      where: and(
        eq(rateLimits.identifier, ip),
        eq(rateLimits.type, "ip"),
        gte(rateLimits.windowStart, windowStart),
      ),
    });

    if (ipLimit && ipLimit.count >= IP_LIMIT) {
      return c.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests from this IP. Please wait.`,
        },
        429,
      );
    }

    // Update or create IP limit
    if (ipLimit) {
      await db
        .update(rateLimits)
        .set({ count: ipLimit.count + 1, updatedAt: now })
        .where(eq(rateLimits.id, ipLimit.id));
    } else {
      await db
        .delete(rateLimits)
        .where(and(eq(rateLimits.identifier, ip), eq(rateLimits.type, "ip")));

      await db.insert(rateLimits).values({
        identifier: ip,
        type: "ip",
        count: 1,
        windowStart: now,
      });
    }

    await next();
  } catch (error) {
    console.error("Rate limit error:", error);
    await next(); // Allow request on error
  }
};
