const express = require("express");
const { getHello } = require("../controllers/systemController");

const router = express.Router();

router.get("/hello", getHello);

module.exports = router;
