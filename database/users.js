const database = include("databaseConnection").database;

async function createUser(postData) {
	//default api token values
	let initializeAPITokenSQL = `
		INSERT INTO API_token
		(available_tokens, tokens_used)
		VALUES
		(20, 0);
	`;
	// usertype id defaults to 2 in the database (regular user)
	let createUserSQL = `
    INSERT INTO user
    (email, password, api_token_id)
    VALUES
    (:email, :passwordHash, :apiTokenId);
  `;

	try {
		const apiTokenResults = await database.query(initializeAPITokenSQL);
		const apiTokenId = apiTokenResults[0].insertId;
		let params = {
			email: postData.email,
			passwordHash: postData.hashedPassword,
			apiTokenId: apiTokenId,
		};
		const results = await database.query(createUserSQL, params);
		const insertedUserId = results[0].insertId;
		if (insertedUserId) {
			console.log("User sucessfully inserted with ID: " + insertedUserId);
			return insertedUserId;
		} else {
			throw new Error("Failed to insert user");
		}
	} catch (err) {
		console.log("Error inserting user");
		console.log(err);
		return false;
	}
}

async function getUserByEmail(email) {
	let getUsersSQL = `SELECT user_id, email, password, user_type_id, api_token_id FROM user WHERE email = ?;`;
	try {
		const [results] = await database.query(getUsersSQL, [email]);

		if (results.length === 0) {
			// No user found with the given email
			console.log("No user found with the given email");
			return [];
		}

		console.log("Successfully retrieved a user");
		return results;
	} catch (err) {
		console.log("Error getting a user");
		console.log(err);
		return false;
	}
}

async function getUserId(email) {
	let getUserSQL = `
		SELECT user_id,
		FROM user
		WHERE email = :user;
	`;

	let params = {
		user: email,
	};

	try {
		const results = await database.query(getUserSQL, params);

		if (results.length > 0) {
			console.log("Successfully found user");
			console.log(results[0]);
			return results[0].user_id;
		} else {
			console.log("User not found");
			return null;
		}
	} catch (err) {
		console.log("Error trying to find user");
		console.log(err);
		return false;
	}
}

async function getUserType(postData) {
	let getUserTypeSQL = `
		  SELECT u.user_type_id, ut.user_type
		  FROM user u
		  INNER JOIN user_type ut ON ut.user_type_id = u.user_type_id
		  WHERE u.email = :email
		  
	  `;

	let params = {
		email: postData.email,
	};

	try {
		const results = await database.query(getUserTypeSQL, params);
		if (results.length > 0) {
			return results[0][0].user_type;
		} else {
			console.log("User not found");
			return null;
		}
	} catch (err) {
		console.log("Error trying to find user");
		console.log(err);
		return false;
	}
}

async function getAllUser(postData) {
	let getAllUserSQL = `
			SELECT u.user_id, u.email, api.available_tokens, api.tokens_used
			FROM user u
			INNER JOIN API_token api ON api.api_token_id = u.api_token_id
			WHERE user_type_id = :user_type_id		
		`;

	let params = {
		user_type_id: postData.user_type_id,
	};

	try {
		const results = await database.query(getAllUserSQL, params);
		if (results.length > 0) {
			return results[0];
		} else {
			console.log("User not found");
			return null;
		}
	} catch (err) {
		console.log("Error trying to find user");
		console.log(err);
		return false;
	}
}

async function updateUserTokens(postData) {
	let updateUserTokensSQL = `
	UPDATE API_token 
	INNER JOIN user u ON API_token.api_token_id = u.api_token_id
	SET API_token.available_tokens = :available_tokens
	WHERE u.user_id = :user_id;
`;

	let params = {
		user_id: postData.user_id,
		available_tokens: postData.available_tokens,
	};

	try {
		const results = await database.query(updateUserTokensSQL, params);
		if (results.length > 0) {
			return true;
		} else {
			console.log("User not found");
			return false;
		}
	} catch (err) {
		console.log("Error trying to update user");
		console.log(err);
		return false;
	}
}

async function getUserAvailableTokens(userId) {
	let getUserAvailableTokensSQL = `
		SELECT api.available_tokens, api.tokens_used
    FROM user u
    INNER JOIN API_token api ON api.api_token_id = u.api_token_id
    WHERE u.user_id = :user_id
	`;

	let params = {
		user_id: userId,
	};
	try {
		const results = await database.query(getUserAvailableTokensSQL, params);
		return results[0][0];
	} catch (err) {
		console.log("Error trying to get user available tokens");
		console.log(err);
		return false;
	}
}
module.exports = {
	createUser,
	getUserByEmail,
	getUserId,
	getUserType,
	getAllUser,
	updateUserTokens,
	getUserAvailableTokens,
};
