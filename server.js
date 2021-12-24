const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

const userSchema = new Schema({
	username: {
		type: String,
		required: true,
	},
	log: [
		{
			description: String,
			duration: Number,
			date: String,
		},
	],
});

const User = mongoose.model("User", userSchema);

app.use("/api/users", bodyParser.urlencoded({ extended: false }));

app.get("/api/users/:_id/logs", (req, res) => {
	const { from, to, limit } = req.query;

	User.findById(req.params._id, (err, user) => {
		if (err) return console.error(err);
		let log = user.log;

		if (from && to) {
			const fromDate = new Date(from);
			const toDate = new Date(to);
			log = log.filter(
				(exercise) =>
					new Date(exercise.date) > fromDate && new Date(exercise.date) < toDate
			);
		}

		if (from) {
			const fromDate = new Date(from);
			log = log.filter((exercise) => new Date(exercise.date) > fromDate);
		}

		if (to) {
			const toDate = new Date(to);
			log = log.filter((exercise) => new Date(exercise.date) < toDate);
		}

		if (limit) {
			log = user.log.filter((exercise, index) => index < limit);
		}
		res.json({
			username: user.username,
			count: log.length,
			_id: user._id,
			log: log,
		});
	});
});

app.get("/api/users", (req, res) => {
	User.find({}, (err, users) => {
		if (err) return console.error(err);
		const usersFormatted = users.map((user) => {
			return { username: user.username, _id: user._id };
		});
		res.json(usersFormatted);
	});
});

app.post("/api/users", (req, res) => {
	const { username } = req.body;

	const newUser = new User({ username });
	newUser.save((err, data) => {
		if (err) return console.error(err);
		res.json({ username: data.username, _id: data._id });
	});
});

app.post("/api/users/:_id/exercises", (req, res) => {
	let { description, duration, date } = req.body;

	if (req.params._id) {
		if (!date) {
			date = new Date().toDateString();
		}

		User.findByIdAndUpdate(
			req.params._id,
			{ $push: { log: { description, duration, date } } },
			{ new: true },
			(err, user) => {
				if (err) return console.error(err);
				res.json({
					username: user.username,
					description: user.log[user.log.length - 1].description,
					duration: user.log[user.log.length - 1].duration,
					date: user.log[user.log.length - 1].date,
					_id: user._id,
				});
			}
		);
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
