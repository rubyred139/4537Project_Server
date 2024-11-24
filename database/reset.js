const database = include("databaseConnection").database;

async function createPasswordReset(userId, resetToken, expiryDate) {
  const createResetSQL = `
    INSERT INTO password_reset (user_id, reset_token, expiry_date)
    VALUES (:userId, :resetToken, :expiryDate);
  `;
  let params = {
    userId,
    resetToken,
    expiryDate,
  };

  try {
    const results = await database.query(createResetSQL, params);
    console.log("Password reset record created successfully");
    return results[0].insertId; // Return the ID of the inserted record
  } catch (err) {
    console.error("Error creating password reset record");
    console.error(err);
    return false;
  }
}

async function getPasswordResetByToken(token) {
  const getResetSQL = `
    SELECT user_id, expiry_date
    FROM password_reset
    WHERE reset_token = :token;
  `;
  let params = { token };

  try {
    const [results] = await database.query(getResetSQL, params);
    if (results.length > 0) {
      console.log("Password reset record retrieved");
      return results[0];
    } else {
      console.log("No matching password reset record found");
      return null;
    }
  } catch (err) {
    console.error("Error retrieving password reset record");
    console.error(err);
    return false;
  }
}

async function deletePasswordResetByToken(token) {
  const deleteResetSQL = `
    DELETE FROM password_reset
    WHERE reset_token = :token;
  `;
  let params = { token };

  try {
    const results = await database.query(deleteResetSQL, params);
    console.log("Password reset record deleted successfully");
    return results[0].affectedRows > 0; // Return true if rows were deleted
  } catch (err) {
    console.error("Error deleting password reset record");
    console.error(err);
    return false;
  }
}

async function deletePasswordResetsByUserId(userId) {
  const deleteResetsSQL = `
    DELETE FROM password_reset
    WHERE user_id = :userId;
  `;
  let params = { userId };

  try {
    const results = await database.query(deleteResetsSQL, params);
    console.log("All password reset records for user deleted");
    return results[0].affectedRows > 0; // Return true if rows were deleted
  } catch (err) {
    console.error("Error deleting password resets by user ID");
    console.error(err);
    return false;
  }
}

module.exports = {
  createPasswordReset,
  getPasswordResetByToken,
  deletePasswordResetByToken,
  deletePasswordResetsByUserId,
};
