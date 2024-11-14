function isValidSession(req) {
	if (req.session.authenticated) {
		return true;
	}
	return false;
}

function sessionValidation(req, res, next) {
	if (isValidSession(req)) {
		next();
	} else {
		res.status(401).json({
			error: "Unauthorized. Please log in.",
			redirect: "/login",
		});
	}
}

module.exports = { isValidSession, sessionValidation };
