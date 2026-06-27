import { HttpError } from "../utils/http-error.js";

export function authMiddleware(req, _res, next) {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  if (!userId || !role) {
    return next(new HttpError(401, "Authentication required"));
  }
  req.user = {
    id: String(userId),
    role: String(role),
    username: req.headers["x-user-name"] ? String(req.headers["x-user-name"]) : "",
  };
  return next();
}
