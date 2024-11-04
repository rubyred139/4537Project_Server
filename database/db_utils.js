const database = include("databaseConnection").database;

async function printMySQLVersion() {
  let sqlQuery = `
		SHOW VARIABLES LIKE 'version';
	`;

  try {
    const results = await database.query(sqlQuery);
    console.log("Successfully connected to MySQL");
    console.log(results[0]);
    return true;
  } catch (err) {
    console.log("Error getting version from MySQL");
    console.log(err);
    return false;
  }
}
async function updateAPITokens(userId, tokensUsed) {
  let updateTokensSQL = `
		UPDATE API_token
		SET available_tokens = available_tokens - ?, tokens_used = tokens_used + ? 
       	WHERE api_token_id = (SELECT api_token_id FROM user WHERE user_id = ?)
	`;

  const params = [tokensUsed, tokensUsed, userId];

  try {
    const [results] = await database.query(updateTokensSQL, params);
    return results.affectedRows > 0;
  } catch (err) {
    console.log("Error updating tokens", err);
    return false;
  }
}

module.exports = {
  printMySQLVersion,
  updateAPITokens,
};
