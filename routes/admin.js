const router = require("express").Router();
const users = require("../database/users");
const database = include("databaseConnection").database;

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Retrieve all user information
 *     parameters:
 *       - in: header
 *         name: x-user-email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address of the user making the request
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID of the user making the request
 *     responses:
 *       200:
 *         description: Admin user successfully retrieved all user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully retrieved all user information"
 *                 allUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *       302:
 *         description: Redirect to home page for regular users
 */

router.get("/", async (req, res) => {
  const userEmail = req.headers["x-user-email"];
  const userId = req.headers["x-user-id"];
  if (!userEmail || !userId) {
    return res.status(400).json({ message: "Missing required headers." });
  }
  const user_type = await users.getUserType({ email: userEmail });

  if (user_type === "regular") {
    return res.redirect("/");
  } else if (user_type === "admin") {
    const usertypeidQuery = `SELECT user_type_id FROM user_type WHERE user_type = :user_type`;
    const usertypeid = await database.query(usertypeidQuery, {
      user_type: "regular",
    });

    const allUsers = await users.getAllUser({
      user_type_id: usertypeid[0][0].user_type_id,
    });
    return res.status(200).json({
      message: "successfully retreive all user information",
      allUsers,
    });
  }
});

/**
 * @swagger
 * /admin/manageAPI/{user_id}:
 *   patch:
 *     summary: Update the number of available tokens for a specific user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the target user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available_tokens:
 *                 type: integer
 *                 description: Number of tokens to update
 *             required:
 *               - available_tokens
 *     responses:
 *       200:
 *         description: Tokens updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tokens updated successfully.
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.patch("/manageAPI/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const available_tokens = req.body.available_tokens;

    // Ensure body contains the required field
    if (available_tokens === undefined) {
      return res.status(400).json({ message: "available_tokens is required." });
    }

    const result = await users.updateUserTokens({
      user_id: user_id,
      available_tokens: available_tokens,
    });

    if (!result) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Tokens updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
