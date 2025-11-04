const jwt = require('jsonwebtoken');

exports.identifier = (req, res, next) => {
  try {
    console.log('-----------------------------------');
    console.log('Authorization Header:', req.headers.authorization);
    console.log('Client Header:', req.headers.client);
    console.log('Cookies:', req.cookies);
    console.log('-----------------------------------');

    let token;

    // 1️⃣ Handle Postman requests
    if (req.headers.client && req.headers.client.toLowerCase() === 'not-browser') {
      token = req.headers.authorization;
    } else {
      // 2️⃣ Handle browser requests (cookies)
      token = req.cookies['Authorization'];
    }

    // 3️⃣ No token at all
    if (!token) {
      console.log('❌ No token provided!');
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized: No token provided' });
    }

    // 4️⃣ Ensure "Bearer" prefix
    const userToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    // 5️⃣ Verify JWT
    const decoded = jwt.verify(userToken, process.env.TOKEN_SECRET);
    console.log('✅ JWT Verified:', decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return res
      .status(401)
      .json({ success: false, message: `Unauthorized: ${error.message}` });
  }
};
