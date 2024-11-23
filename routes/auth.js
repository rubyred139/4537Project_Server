const router = require("express").Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const users = require("../database/users");

// Helper function to generate JWT token
const generateToken = (user) => {
	return jwt.sign(
		{
			userId: user.user_id,
			email: user.email,
			userType: user.userType,
		},
		process.env.JWT_SECRET,
		{ expiresIn: "1h" }
	);
};

/**
 * @swagger
 * /auth/signupSubmit:
 *   post:
 *     summary: Create a new user account
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *     responses:
 *       200:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup successful
 *                 redirectUrl:
 *                   type: string
 *                   example: /profile.html
 *                 userType:
 *                   type: string
 *                   example: regular
 *                 userId:
 *                   type: int
 *                   example: 1
 *                 userEmail:
 *                   type: string
 *                   example: user@example.com
 *       400:
 *         description: Invalid email or password
 *       401:
 *         description: Email already in use
 *       500:
 *         description: Error creating user account
 */
router.post("/signupSubmit", async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(3).max(20).required(),
	});

	const validationResult = schema.validate({ email, password });
	if (validationResult.error != null) {
		return res
			.status(400)
			.json({ errorMessage: validationResult.error.message });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const userId = await users.createUser({ email, hashedPassword });
		if (!userId) {
			return res
				.status(401)
				.json({ errorMessage: "Email already in use" });
		}

		const user = {
			user_id: userId,
			email,
			userType: "regular",
		};

		const token = generateToken(user);

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 1000, // 1 hour
		});

		return res.status(200).json({
			message: "Signup successful",
			redirectUrl: "/profile.html",
			userType: user.userType,
			userId: user.user_id,
			userEmail: user.email,
		});
	} catch (error) {
		console.error("Error inserting user:", error.message);
		return res.status(500).json({
			errorMessage: "Error creating your account.",
		});
	}
});

/**
 * @swagger
 * /auth/loginSubmit:
 *   post:
 *     summary: Login user with email and password
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 redirectUrl:
 *                   type: string
 *                   example: /index.html
 *                 userType:
 *                   type: string
 *                   example: regular
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 userEmail:
 *                   type: string
 *                   example: user@example.com
 *       401:
 *         description: Incorrect email or password
 *       500:
 *         description: Internal server error
 */
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
		const passwordMatches = await bcrypt.compare(password, user.password);

		if (passwordMatches) {
			const userType = await users.getUserType({ email: user.email });

			const userData = {
				user_id: user.user_id,
				email: user.email,
				userType,
			};

			const token = generateToken(userData);

			res.cookie("token", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60 * 60 * 1000,
			});

			return res.status(200).json({
				message: "Login successful",
				redirectUrl:
					userType === "admin" ? "/admin.html" : "/index.html",
				userType,
				userId: user.user_id,
				userEmail: user.email,
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

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user and destroy session
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Error logging out
 */
router.get("/logout", (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ message: "Logged out successfully" });
});

/**
 * @swagger
 * /auth/deleteAccount:
 *   delete:
 *     summary: Delete the current user's account
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       500:
 *         description: Error deleting account
 */
router.delete("/deleteAccount", async (req, res) => {
	const userId = req.user.userId;

	try {
		const result = await users.deleteUser(userId);
		if (result) {
			res.clearCookie("token");
			return res
				.status(200)
				.json({ message: "Account deleted successfully" });
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
