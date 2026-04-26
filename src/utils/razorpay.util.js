import Razorpay from 'razorpay';
import crypto   from 'crypto';
import config   from '../config/app.config.js';

/**
 * Razorpay client singleton.
 * Like a Spring @Bean — initialized once, reused everywhere.
 */
let razorpayClient = null;

export const getRazorpayClient = () => {
  if (!config.razorpay.isConfigured) {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id:     config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  return razorpayClient;
};

/**
 * Creates a Razorpay order.
 * This is step 1 of the payment flow — before the user pays.
 *
 * @param {number} amount     - Amount in PAISE (1 INR = 100 paise)
 * @param {string} receipt    - Your internal booking/payment ID
 * @param {object} notes      - Extra metadata stored on Razorpay
 */
export const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  const client = getRazorpayClient();

  return client.orders.create({
    amount:   Math.round(amount * 100), // convert INR to paise
    currency: 'INR',
    receipt,
    notes,
  });
};

/**
 * Verifies Razorpay payment signature.
 *
 * This is a cryptographic check — the signature is an HMAC-SHA256
 * of "orderId|paymentId" using your key secret.
 *
 * If signature matches → payment is genuine.
 * If not → payment details were tampered with.
 *
 * Spring Boot equivalent: verifying a JWT signature — same concept.
 */
export const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected  = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  return expected === razorpaySignature;
};

/**
 * Verifies Razorpay webhook signature.
 * Different from payment signature — uses webhook secret.
 */
export const verifyWebhookSignature = (body, signature) => {
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(JSON.stringify(body))
    .digest('hex');

  return expected === signature;
};

/**
 * Initiates a refund via Razorpay.
 *
 * @param {string} paymentId  - Razorpay payment ID to refund
 * @param {number} amount     - Amount to refund in INR (partial or full)
 */
export const initiateRefund = async (paymentId, amount) => {
  const client = getRazorpayClient();

  return client.payments.refund(paymentId, {
    amount: Math.round(amount * 100), // convert to paise
  });
};