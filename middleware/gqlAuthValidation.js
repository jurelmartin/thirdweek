const jwt = require('jsonwebtoken');

module.exports = (request, response, next) => {
  const authHeader = request.get('Authorization');
  if (!authHeader) {
    request.isAuth = false;
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'mysecretprivatekey');
  } catch (err) {
    request.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  request.userId = decodedToken.userId;
  request.permissionLevel = decodedToken.permissionLevel;
  request.isAuth = true;
  console.log(request.permissionLevel);
  next();
};