require("./utils.js");
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 8080;
const cors = require("cors");
const url = require("url");

const swaggerSetup = require("./swagger");
const app = express();

swaggerSetup(app);

const homeRouter = include("routes/home");
const authRouter = include("routes/auth");
const adminRouter = include("routes/admin");
const userRouter = include("routes/user");

//database connection
const db_utils = include("database/db_utils");
db_utils.printMySQLVersion();

app.set("view engine", "ejs");

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

const navLinks = [
	{ name: "Home", link: "/" },
	{ name: "Admin", link: "/admin" },
	{ name: "Login", link: "/auth/login" },
	{ name: "Signup", link: "/auth/signup" },
	{ name: "Logout", link: "/auth/logout" },
];

// View middleware - only handles view-related logic
app.use("/", (req, res, next) => {
	app.locals.navLinks = navLinks;
	app.locals.currentURL = url.parse(req.url).pathname;
	res.locals.errorMessage = null;
	next();
});

app.use(express.static(__dirname + "/public"));
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);

app.get("*", (req, res) => {
	res.status(404).json({ error: "Page Not Found" });
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
	console.log("API docs available at http://localhost:8080/api/docs");
});
