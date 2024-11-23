const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
	const token = req.cookies.token;

	if (!token) {
		return res.status(401).json({ error: "Authentication required" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		res.clearCookie("token");
		return res.status(403).json({ error: "Invalid token" });
	}
};

const isAdmin = (req, res, next) => {
	if (req.user && req.user.userType === "admin") {
		next();
	} else {
		return res.status(403).json({ error: "Admin access required" });
	}
};

module.exports = { authenticateToken, isAdmin };
