import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";

const listEndpoints = require("express-list-endpoints");

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(bodyParser.json());

const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: [true, "Message is required"],
    minlength: 5,
    maxlength: 140,
    // unique: true,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  username: {
    type: String,
    default: "Anonymous",
  },
});

// Start defining your routes here
app.get("/", (req, res) => {
  res.send(listEndpoints(app));
});

app.get("/thoughts", async (req, res) => {
  const thoughts = await Thought.find().sort({ createdAt: "desc" }).limit(20);
  if (thoughts.length > 0) {
    res.json(thoughts);
  } else {
    res.status(400).json({ error: "No thoughts found" });
  }
});

app.post("/thoughts", async (req, res) => {
  try {
    const { message, username } = req.body;
    const thought = await new Thought({
      message,
      username: username || "Anonymous",
    }).save();

    res.json(thought);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not save thought",
      errors: error.errors,
    });
  }
});

app.post("/thoughts/:thoughtId/like", async (req, res) => {
  try {
    const { thoughtId } = req.params;
    await Thought.findOneAndUpdate({ _id: thoughtId }, { $inc: { hearts: 1 } });
    res.json();
  } catch (error) {
    res
      .status(400)
      .json({ message: "Could not find post to like", errors: error.errors });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
