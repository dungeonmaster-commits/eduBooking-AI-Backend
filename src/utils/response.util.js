/**
 * Sends a standardized success response.
 * 
 * Example output:
 * { success: true, message: "User created", data: { id: "...", email: "..." } }
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };
  
  /**
   * Sends a standardized error response.
   */
  export const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  };