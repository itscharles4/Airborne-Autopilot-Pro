const PERMISSIONS = {
  ADMIN:    ['*'],
  OPERATOR: ['drones:read','drones:write','orders:read','orders:write','flights:read','missions:write','pathfinder:use','alerts:read','alerts:write'],
  ANALYST:  ['drones:read','orders:read','flights:read','revenue:read','health:read','alerts:read'],
  VIEWER:   ['drones:read','flights:read','health:read'],
};

const authorize = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userPerms = PERMISSIONS[req.user.role] || [];

    if (userPerms.includes('*')) return next();

    const hasAll = requiredPerms.every(p => userPerms.includes(p));
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires permissions [${requiredPerms.join(', ')}]`,
        yourRole: req.user.role,
      });
    }
    next();
  };
};

module.exports = { authorize };
