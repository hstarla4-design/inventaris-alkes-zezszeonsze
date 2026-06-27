import { HttpError } from "../utils/http-error.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(422, "Validation failed", result.error.flatten()));
    }
    req.body = result.data;
    return next();
  };
}
