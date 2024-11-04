require("./utils.js");

require("dotenv").config();
const express = require("express");

const port = process.env.PORT || 8080;
const cors = require("cors");

const app = express();
const session = require("express-session");
const url = require("url");

const homeRouter = include("routes/home");
const authRouter = include("routes/auth");
const adminRouter = include("routes/admin");

//database connection
const db_utils = include("database/db_utils");
const mongoStore = include("databaseConnection").mongoStore;

const sessionValidation = include(
	"routes/function/sessionValidation"
).sessionValidation;

db_utils.printMySQLVersion();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
	cors({
		origin: "*", // Allow all origins
	})
);

app.use(
	session({
		secret: process.env.MONGODB_SESSION_SECRET,
		store: mongoStore, //default is memory store
		saveUninitialized: false,
		resave: true,
	})
);
const navLinks = [
	{ name: "Home", link: "/" },
	{ name: "Admin", link: "/admin" },
	{ name: "Login", link: "/auth/login" },
	{ name: "Signup", link: "/auth/signup" },
	{ name: "Logout", link: "/auth/logout" },
];

//middle ware
app.use("/", (req, res, next) => {
	app.locals.navLinks = navLinks;
	app.locals.currentURL = url.parse(req.url).pathname;
	res.locals.loggedIn = req.session.email ? true : false;
	res.locals.errorMessage = null;
	res.locals.userType = req.session.userType;
	next();
});

app.use(express.static(__dirname + "/public"));
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);

app.get("*", (req, res) => {
	res.status(404).json({ error: "Page Not Found" });
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
});
