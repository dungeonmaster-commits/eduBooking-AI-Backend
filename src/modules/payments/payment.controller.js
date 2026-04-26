import * as paymentService from './payment.service.js';
import { sendSuccess }     from '../../utils/response.util.js';

export const initiatePayment = async (req, res, next) => {
  try {
    const result = await paymentService.initiatePayment(
      req.user.id,
      req.validatedBody
    );
    return sendSuccess(res, {
      statusCode: 201,
      message:    result.isFree ? result.message : 'Payment order created',
      data:       result,
    });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(
      req.user.id,
      req.validatedBody
    );
    return sendSuccess(res, { message: result.message, data: result });
  } catch (err) { next(err); }
};

/**
 * Webhook handler — no auth middleware here.
 * Razorpay calls this directly, not the user.
 * Security is handled by signature verification inside the service.
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result    = await paymentService.handleWebhook(req.body, signature);
    // Always return 200 to Razorpay — otherwise it keeps retrying
    return res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getMyPayments(
      req.user.id,
      req.validatedQuery
    );
    return sendSuccess(res, { message: 'Payments retrieved', data: result });
  } catch (err) { next(err); }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    return sendSuccess(res, { message: 'Payment retrieved', data: payment });
  } catch (err) { next(err); }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getAllPayments(req.validatedQuery);
    return sendSuccess(res, { message: 'All payments retrieved', data: result });
  } catch (err) { next(err); }
};

export const initiateRefund = async (req, res, next) => {
  try {
    const payment = await paymentService.initiateRefund(
      req.params.id,
      req.validatedBody,
      req.user
    );
    return sendSuccess(res, { message: 'Refund initiated', data: payment });
  } catch (err) { next(err); }
};