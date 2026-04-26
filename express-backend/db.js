const mongoose = require("mongoose");
require("dotenv").config();

const connection = mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/");

module.exports = {
  connection,
};
