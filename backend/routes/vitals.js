import express from "express";
const router = express.Router();
// We'll import the model we defined in index.js, 
// but for now, let's just keep the route logic clean.

router.get("/test", (req, res) => {
    res.json({ message: "Vitals route is active" });
});

export default router;