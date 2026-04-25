import { sendError } from '../utils/response.util.js';

const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'query' ? (req.query ?? {}) : (req.body ?? {});

  console.log('validate source:', source);  // ← add this
  console.log('validate data:', data);      // ← add this

  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, { statusCode: 400, message: 'Validation failed', errors });
  }

  console.log('validate result:', result.data);  // ← add this

  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req.validatedBody = result.data;
  }

  next();
};

export default validate;