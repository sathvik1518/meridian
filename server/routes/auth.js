import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { HttpError, clearSessionCookie, requireAuth, setSessionCookie, signSession } from "../http.js";
import { loginInput } from "../validation.js";

// A fixed fake hash so a wrong email takes as long as a wrong password (stops "does this email exist?" probing).
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.2n8E1l3u4nT1p1VxZl0b3nQ0b0b2";

export function authRoutes(db) {
  const router = Router();
  const limiter =
    process.env.RATE_LIMIT === "off"
      ? (_req, _res, next) => next()
      : rateLimit({
          windowMs: 15 * 60_000,
          limit: 40,
          standardHeaders: true,
          legacyHeaders: false,
          message: { message: "Too many sign-in attempts. Try again in a few minutes." },
        });
  router.post("/login", limiter, async (req, res) => {
    const { email, password, remember } = loginInput.parse(req.body);
    const [row] = await db.query("SELECT id, name, email, role, title, password_hash, active FROM users WHERE email = $1", [email]);
    const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !ok || !row.active) throw new HttpError(401, "That email and password don't match.");
    const user = { id: row.id, name: row.name, email: row.email, role: row.role, title: row.title };
    const { token, expiresAt } = signSession(user);
    setSessionCookie(res, token, remember);
    res.json({ user, expiresAt });
  });
  router.post("/logout", (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });
  router.get("/me", requireAuth(db), (req, res) => {
    res.json({ user: req.user, expiresAt: req.sessionExpiresAt });
  });
  return router;
}
