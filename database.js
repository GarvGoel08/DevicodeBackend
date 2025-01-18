const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = async () => {
  const { connection } = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDb connected with ${connection.host}` .bgGreen );
};

module.exports = { connectDB };