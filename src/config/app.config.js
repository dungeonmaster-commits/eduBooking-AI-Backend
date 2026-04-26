// This is your application.properties equivalent
// We read from process.env (populated by dotenv)

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    
    database: {
      url: process.env.DATABASE_URL,
    },
  
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
  
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
      baseUrl: 'https://www.googleapis.com/youtube/v3',
    },
  
    udemy: {
      clientId:     process.env.UDEMY_CLIENT_ID     || null,
      clientSecret: process.env.UDEMY_CLIENT_SECRET || null,
      baseUrl:      'https://www.udemy.com/api-2.0',
      isConfigured: !!(process.env.UDEMY_CLIENT_ID && process.env.UDEMY_CLIENT_SECRET),
    },
    razorpay: {
      keyId:         process.env.RAZORPAY_KEY_ID,
      keySecret:     process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
      isConfigured:  !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
  };
  
  // Fail fast — crash early if critical config is missing
  // (Spring Boot does this automatically; we do it manually here)
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  export default config;