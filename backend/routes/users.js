import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /api/users?email=foo@bar.com
router.get("/", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send("missing email query parameter");

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).end();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// POST /api/users  (body: { email, role, ...other })
router.post("/", async (req, res) => {
  const { email, role, ...rest } = req.body;
  if (!email || !role)
    return res.status(400).send("email and role are required");

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role, ...rest },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

export default router;
