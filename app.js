const express = require("express");
const { config } = require("dotenv");
const bodyParser = require('body-parser');
const ErrorMiddleware = require("./middlewares/Error.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");

config({
  path: "./.env",
});

const app = express();

//using middleware
const corsOptions = {
  origin: ["http://localhost:3000", "https://devicode.vercel.app"],
  optionsSuccessStatus: 200, 
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

//Routes
const user = require("./routes/userRoute.js");
const project = require("./routes/projectRoute.js");
const schema = require("./routes/schemaRoute.js");

app.use("/api/v1", user);
app.use("/api/v1", project);
app.use("/api/v1", schema);

const dynamic = require("./routes/dynamicRoute.js");

app.use("/dynamic/", dynamic);


app.get("/", (req, res) => {
  res.send("Devicode server is now live. You can start creating your backend effortlessly");
});

app.use(ErrorMiddleware);
module.exports = app;