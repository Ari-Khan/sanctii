import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["doctor", "patient", "hacker"], required: true },
  name: String,
  phone: String,
  avatarUrl: String,
  // add any other fields you need for your application
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
