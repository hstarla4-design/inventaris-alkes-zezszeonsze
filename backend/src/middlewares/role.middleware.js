import { HttpError } from "../utils/http-error.js";

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Role is not allowed for this action"));
    }
    return next();
  };
}
