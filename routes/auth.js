const router = require("express").Router();
const Joi = require("joi");

const bcrypt = require("bcrypt");
const saltRounds = 12;
const expireTime = 60 * 60 * 1000; //expires after an hour  (hours * minutes * seconds * millis)

const users = require("../database/users");
const isValidSession = include(
	"routes/function/sessionValidation"
).isValidSession;

router.get("/", (req, res) => {
	const loggedIn = req.session.authenticated || false;
	res.json({ loggedIn: loggedIn });
});

// router.get("/signup", (req, res) => {
// 	if (isValidSession(req)) {
// 		return res.redirect("/");
// 	}
// 	res.render("signup");
// });

router.post("/signupSubmit", async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(3).max(20).required(),
	});

	const validationResult = schema.validate({ email, password });
	if (validationResult.error != null) {
		const errorMessage = validationResult.error.message;
		console.log(validationResult.error);
		return res.status(400).json({ errorMessage: errorMessage });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const userId = await users.createUser({ email, hashedPassword });

		req.session.authenticated = true;
		req.session.email = email;
		req.session.userId = userId;
		req.session.cookie.maxAge = expireTime;

		return res.status(200).json({
			message: "User created successfully",
			userId: req.session.userId,
		});
	} catch (error) {
		console.error("Error inserting user:", error.message);
		return res.status(500).json({
			errorMessage: "Error creating your account.",
		});
	}
});

// router.get("/login", (req, res) => {
// 	if (isValidSession(req)) {
// 		return res.redirect("/");
// 	}
// 	const errorMessage = req.query.error || null;
// 	res.render("login", { errorMessage });
// });

router.post("/loginSubmit", async (req, res) => {
	const { email, password } = req.body;

	try {
		const rows = await users.getUserByEmail(email);

		if (rows.length === 0) {
			return res.status(401).json({
				errorMessage: "Incorrect email or password",
			});
		}
		const user = rows[0];
		if (user) {
		}
		const passwordMatches = await bcrypt.compare(password, user.password);

		if (passwordMatches) {
			const userType = await users.getUserType({ email: user.email });
			req.session.authenticated = true;
			req.session.email = user.email;
			req.session.userId = user.user_id;
			req.session.userType = userType;
			req.session.cookie.maxAge = expireTime;
			console.log("userType: " + req.session.userType);

			console.log("userId: " + req.session.userId);

			const redirectUrl =
				userType === "admin" ? "/admin.html" : "/index.html";
			return res.status(200).json({
				message: "Login successful",
				redirectUrl,
				userType,
				userId: req.session.userId,
				userEmail: req.session.email,
			});
		} else {
			return res.status(401).json({
				errorMessage: "Incorrect email or password",
			});
		}
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ errorMessage: "Internal server error" });
	}
});

router.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error("Logout error:", err);
			return res.status(500).json({ errorMessage: "Error logging out." });
		}
		res.status(200).json({ message: "Logged out successfully" });
	});
});

module.exports = router;
