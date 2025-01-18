const app = require("./app.js");
const { connectDB } = require("./database.js");
const colors = require("colors");
const { config } = require("dotenv");

//handling uncaught
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

//config
config({
  path: "./.env",
});

connectDB();

app.listen(process.env.PORT, () => {
    console.log(
      `Server Running on port ${process.env.PORT}`.bgCyan
        .white
    );
});

//Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err.message}`);
  console.log(`Shutting Down the server due to unhandled promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});