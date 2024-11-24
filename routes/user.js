const express = require("express");
const router = express.Router();
const users = require("../database/users");

/**
 * @swagger
 * /user/{email}:
 *   get:
 *     summary: Retrieve a user by email
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address of the user to retrieve
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *       404:
 *         description: User not found
 */
router.get("/:email", async (req, res) => {
	const email = req.params.email;
	const user = await users.getUserByEmail(email);

	if (!user) {
		return res.status(404).json({ message: "User not found." });
	}

	res.status(200).json({
		user: user,
	});
});

/**
 * @swagger
 * /user/tokens/{userId}:
 *   get:
 *     summary: Retrieve the available tokens for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's available tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userAvailableTokens:
 *                   type: integer
 *                   example: 100
 *       400:
 *         description: User ID is missing or invalid
 *       404:
 *         description: User or tokens not found
 */
router.get("/tokens/:userId", async (req, res) => {
	const uid = req.params.userId;

	if (!uid) {
		return res.status(404).json({ message: "User not found." });
	}
	const userAvailableTokens = await users.getUserAvailableTokens(uid);
	if (!userAvailableTokens) {
		return res
			.status(404)
			.json({ message: "User not found or tokens are unavailable." });
	}

	return res.status(200).json({
		userAvailableTokens: userAvailableTokens,
	});
});

module.exports = router;
