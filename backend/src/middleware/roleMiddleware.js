const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {

    // 🛠 fallback safety
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: "No roles found in token" });
    }

    if (!req.user.roles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

module.exports = roleMiddleware;