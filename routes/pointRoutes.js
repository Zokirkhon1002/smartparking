const express = require("express");
const router = express.Router();
const { getAllPoints } = require("../controllers/pointController");

router.get("/points", getAllPoints);

module.exports = router;
