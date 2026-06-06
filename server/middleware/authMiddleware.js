function isLoggedIn(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Please login first' });
  }

  req.user = req.session.user;
  next();
}

function hasRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Please login first' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized for this ERP action' });
    }

    next();
  };
}

module.exports = { isLoggedIn, hasRole };
