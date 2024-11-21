const router = require("express").Router();
const Joi = require("joi");

const bcrypt = require("bcrypt");
const saltRounds = 12;
const expireTime = 60 * 60 * 1000; //expires after an hour  (hours * minutes * seconds * millis)

const users = require("../database/users");

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
		return res.status(400).json({ errorMessage: errorMessage });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const userId = await users.createUser({ email, hashedPassword });
		if (!userId) {
			return res
				.status(400)
				.json({ errorMessage: "Email already in use" });
		}

		req.session.authenticated = true;
		req.session.email = email;
		req.session.userId = userId;
		req.session.userType = "regular";
		req.session.cookie.maxAge = expireTime;

		const redirectUrl = "/profile.html";
		return res.status(200).json({
			message: "Signup successful",
			redirectUrl,
			userType: req.session.userType,
			userId: req.session.userId,
			userEmail: req.session.email,
		});
	} catch (error) {
		console.error("Error inserting user:", error.message);
		return res.status(500).json({
			errorMessage: "Error creating your account.",
		});
	}
});

router.post("/loginSubmit", async (req, res) => {
	const { email, password } = req.body;

	try {
		const rows = await users.getUserByEmail(email);

		if (rows.length === 0) {
			return res.status(401).json({
				errorMessage: "User does not exist",
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
	console.error("Logout called");
	req.session.destroy((err) => {
		if (err) {
			console.error("Logout error:", err);
			return res.status(500).json({ errorMessage: "Error logging out." });
		}
		res.status(200).json({ message: "Logged out successfully" });
	});
});

router.delete("/deleteAccount", async (req, res) => {
	const userId = req.session.userId;

	try {
		const result = await users.deleteUser(userId);
		if (result) {
			req.session.destroy((err) => {
				if (err) {
					console.error("Session destruction error:", err);
					return res
						.status(500)
						.json({ errorMessage: "Error logging out." });
				}
				console.log(
					"After session destroy - Session should be null:",
					req.session
				);
				return res
					.status(200)
					.json({ message: "Account deleted successfully" });
			});
		} else {
			return res
				.status(500)
				.json({ errorMessage: "Error deleting account" });
		}
	} catch (error) {
		console.error("Delete account error:", error);
		return res.status(500).json({ errorMessage: "Error deleting account" });
	}
});

module.exports = router;
