const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const carRoutes = require("./routes/carRoutes");
const pointRoutes = require("./routes/pointRoutes");

const app = express();

app.use(express.json());
const allowedOrigins = ["http://example.com", "http://localhost:3000"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

const URL = process.env.URL;
mongoose
  .connect(URL)
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.log(err);
  });

// test route
app.get("/", (req, res) => {
  res.json("Rest API is working perfectly!");
});

app.use(carRoutes);
app.use(pointRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});
