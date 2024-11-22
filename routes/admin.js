const router = require("express").Router();
const users = require("../database/users");
const database = include("databaseConnection").database;

router.get("/", async (req, res) => {
  const userEmail = req.headers["x-user-email"];
  const userId = req.headers["x-user-id"];
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
router.patch("/manageAPI/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const available_tokens = req.body.available_tokens;
  const result = await users.updateUserTokens({
    user_id: user_id,
    available_tokens: available_tokens,
  });
  if (result) {
    return res.status(200).json({ message: "Tokens updated successfully." });
  }
});

module.exports = router;
