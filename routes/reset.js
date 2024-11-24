const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const resetDb = require("../database/reset");
const userDb = require("../database/users");
const router = express.Router();

const saltRounds = 12;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset email to the user with a reset link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset email sent."
 *       400:
 *         description: Bad request (e.g., missing email).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email is required."
 *       404:
 *         description: User with the given email not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error."
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Get user by email
    const user = await userDb.getUserByEmail(email);
    if (!user || user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user[0].user_id;

    // Generate reset token and expiry date
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create password reset record
    await resetDb.createPasswordReset(userId, resetToken, expiryDate);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Reset your password using the following link: ${resetUrl}`,
      html: `<p>Reset your password using the link below:</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Error handling forgot password request");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset the user's password
 *     description: Resets the user's password using a token and a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "0c3abcd2fc3fbfa3298efeffb29e8cbacbb35c180e3c48c3f9b14df170c50db7"
 *               newPassword:
 *                 type: string
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successful."
 *       400:
 *         description: Invalid or expired token, or missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token has expired."
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error."
 */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  try {
    // Get reset record by token
    const resetRecord = await resetDb.getPasswordResetByToken(token);
    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { user_id, expiry_date } = resetRecord;

    // Check if token has expired
    if (new Date() > new Date(expiry_date)) {
      return res.status(400).json({ error: "Token has expired" });
    }

    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    const passwordUpdated = await userDb.updateUserPassword(
      user_id,
      hashedPassword
    );
    if (!passwordUpdated) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    // Delete reset record to make the token one-time use
    const tokenDeleted = await resetDb.deletePasswordResetByToken(token);
    if (!tokenDeleted) {
      return res
        .status(500)
        .json({ error: "Failed to invalidate reset token" });
    }

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error handling password reset:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
