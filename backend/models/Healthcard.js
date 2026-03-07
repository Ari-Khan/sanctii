import mongoose from "mongoose";

const healthcardSchema = new mongoose.Schema({
  email:        { type: String, required: true },          // Auth0 user email (owner)
  full_name:    { type: String },
  date_of_birth:{ type: String },
  card_number:  { type: String },
  version_code: { type: String },
  expiry_date:  { type: String },
  gender:       { type: String },
  province:     { type: String },
  issue_date:   { type: String },
  confidence:   { type: Number, default: 0 },
  notes:        { type: String },
  source:       { type: String, enum: ["scan", "manual"], default: "manual" },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});

healthcardSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Healthcard", healthcardSchema);
