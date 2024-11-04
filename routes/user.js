const express = require("express");
const router = express.Router();
const users = require("../database/users");
require("dotenv").config();

const { sessionValidation } = require("./function/sessionValidation");

router.get("/:email", async (req, res) => {
	const email = req.params.email;
	console.log(email);
	const user = await users.getUserByEmail(email);
	res.status(200).json({
		user: user,
	});
});

// Route for the user's available tokens
router.get("/tokens/:userId", async (req, res) => {
	let userAvailableTokens = null;
	const uid = req.params.userId;
	console.log(uid);

	if (uid) {
		userAvailableTokens = await users.getUserAvailableTokens(uid);
	}
	res.status(200).json({
		userAvailableTokens: userAvailableTokens,
	});
});

module.exports = router;
