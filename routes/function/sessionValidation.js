function isValidSession(req) {
  //   if (req.session.authenticated) {
  //     return true;
  //   }
  //   return false;
  return true;
}

function sessionValidation(req, res, next) {
  if (isValidSession(req)) {
    next();
  } else {
    // res.redirect("/auth/login");
    res.status(401).json({ error: "Unauthorized. Please log in." });
  }
}

module.exports = { isValidSession, sessionValidation };
