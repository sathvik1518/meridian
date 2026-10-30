import jwt from "jsonwebtoken";
import { ZodError } from "zod";

export class HttpError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const COOKIE = "meridian_session";

export const SESSION_HOURS = 8;

function secret() {
  const value = process.env.JWT_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production");
  return "dev-only-secret-change-me";
}

export function signSession(user) {
  const expiresAt = Date.now() + SESSION_HOURS * 3_600_000;
  const token = jwt.sign({ sub: String(user.id) }, secret(), { expiresIn: `${SESSION_HOURS}h` });
  return { token, expiresAt };
}

export function setSessionCookie(res, token, remember = true) {
  res.cookie(COOKIE, token, {
    httpOnly: true, // JavaScript in the page can't read it, so XSS can't steal the session
    sameSite: "lax", // not sent on cross-site POSTs, which blocks most CSRF
    // COOKIE_SECURE=0 lets local or plain-http demos work; real HTTPS deployments keep the default.
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "1" : process.env.NODE_ENV === "production",
    // "Remember me" off = a session cookie that disappears when the browser closes.
    ...(remember ? { maxAge: SESSION_HOURS * 3_600_000 } : {}),
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { path: "/" });
}
/** Reads the cookie, verifies the JWT, and loads the user fresh from the database
 *  (so a deactivated account or changed role takes effect immediately). */
export function requireAuth(db) {
  return async (req, _res, next) => {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new HttpError(401, "Please sign in to continue.");
    let id;
    try {
      const payload = jwt.verify(token, secret());
      id = Number(payload.sub);
      req.sessionExpiresAt = (payload.exp ?? 0) * 1000;
    } catch {
      throw new HttpError(401, "Your session has expired. Please sign in again.");
    }
    const [user] = await db.query("SELECT id, name, email, role, title, active FROM users WHERE id = $1", [id]);
    if (!user || !user.active) throw new HttpError(401, "This account is no longer active.");
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title };
    next();
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, "Please sign in to continue.");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "You don't have permission to do that.");
    next();
  };
}

export async function audit(q, user, action, entity, entityId, detail = "") {
  await q.query("INSERT INTO audit_log (user_id, user_name, action, entity, entity_id, detail) VALUES ($1,$2,$3,$4,$5,$6)", [
    user.id,
    user.name,
    action,
    entity,
    entityId === null ? null : String(entityId),
    detail,
  ]);
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) return void res.status(error.status).json({ message: error.message });
  if (error instanceof ZodError) {
    return void res.status(400).json({
      message: "Some fields are invalid.",
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const code = error.code;
  if (code === "LIMIT_FILE_SIZE") return void res.status(413).json({ message: "That file is too large (2 MB max)." });
  if (code === "23505") return void res.status(409).json({ message: "That value is already in use." });
  if (error instanceof SyntaxError) return void res.status(400).json({ message: "The request body isn't valid JSON." });
  console.error(error);
  res.status(500).json({ message: "Something went wrong on our side. Please try again." });
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, "Not found.");
  return id;
}
