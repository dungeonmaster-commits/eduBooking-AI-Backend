import { sendError } from '../utils/response.util.js';

/**
 * Factory function: takes a Zod schema, returns an Express middleware.
 * 
 * Usage: router.post('/register', validate(registerSchema), authController.register)
 * 
 * Spring Boot equivalent: @Valid @RequestBody RegisterDto body
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Format Zod errors into readable messages
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  }

  // Attach validated + sanitized data to request
  req.validatedBody = result.data;
  next();
};

export default validate;