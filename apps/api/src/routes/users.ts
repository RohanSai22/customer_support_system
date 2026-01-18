import { Hono } from "hono";
import { db, users } from "@repo/db";

const usersRouter = new Hono();

// Get all users (for user selection)
usersRouter.get("/", async (c) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .limit(50);

    return c.json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

export default usersRouter;
