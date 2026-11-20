import jwt from 'jsonwebtoken';

export function requireAuth(request, response, next) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ message: 'Please sign in first.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.userId = payload.userId;
    next();
  } catch {
    return response.status(401).json({ message: 'Your session is invalid. Please sign in again.' });
  }
}