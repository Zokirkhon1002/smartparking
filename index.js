const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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

const { CarNumbers } = require("./models/userModel");
const { Points } = require("./models/pointModel");
const { getHours, getPrice } = require("./helpers/helpers");

// get all cars route
app.get("/cars", async (req, res) => {
  let carNumbersArr = await CarNumbers.find();
  if (carNumbersArr.length < 1) {
    return res.json({
      state: false,
      message: "There is not any data!",
      data: null,
    });
  }

  return res.json({
    state: true,
    message: "success",
    data: carNumbersArr,
  });
});

// get data by carNumber
app.get("/cars/:id", async (req, res) => {
  const { id } = req.params;

  // const sendData = await CarNumbers.find({ carNumber: id }).populate({ path: "pointId" });

  // if (sendData.length < 1) {
  //   return res.json({
  //     state: false,
  //     message: "there is not data",
  //   });
  // }

  const carData = await CarNumbers.find({ carNumber: id })
  const pointData = await Points.findOne({ carNumber: id })

  res.json({
    state: true,
    message: "success",
    data: {
      carData,
      pointData
    }
  })

});

// get all points
app.get("/points", async (req, res) => {
  let pointsArr = await Points.find();
  if (pointsArr.length < 1) {
    return res.json({
      state: false,
      message: "There is not any data!",
      data: null,
    });
  }

  return res.json({
    state: true,
    message: "success",
    data: pointsArr,
  });
});

// create new car number
app.post("/cars", async (req, res) => {
  let carNumber = req.body.carNumber;

  if (carNumber.length < 3) {
    return res.json({
      state: false,
      message: "string must be at least 3",
    });
  }

  const oldCarNumber = await CarNumbers.findOne({ carNumber });

  if (oldCarNumber) {
    if (!oldCarNumber.exitTime) {
      return res.json({
        state: false,
        message: "bu mashina hali chiqib ketmadi!",
      });
    }
  }

  const points = await Points.findOne({ carNumber });

  // points => 1. object, 2. null

  let objResult = {
    pointId: points ? points._id : "",
    price: 0,
    carNumber,
    paymentMethod: "",
    exitTime: "",
  };

  try {
    const newCreatedCar = await CarNumbers.create(objResult);

    try {
      if (points) {
        let objResult = {
          usedTimes: points.usedTimes + 1,
          car_ids: [...points.car_ids, newCreatedCar._id],
        };
        const updatedPoints = await Points.findByIdAndUpdate(
          points._id,
          { $set: objResult },
          { new: true }
        );
        if (!updatedPoints) {
          return res.json({ state: false, message: "pointning update qilishda xatolik" });
        }
      }
    } catch (err) {
      return res.json({
        state: false,
        message: "please point error",
        msg: error,
      });
    }
  } catch (error) {
    return res.json({
      state: false,
      message: "please enter another car number",
      msg: error,
    });
  }

  return res.json({
    state: true,
    message: "success",
  });
});

// get price
// return price and unique id
app.put("/cars", async (req, res) => {
  let carNumber = req.body.carNumber;

  if (carNumber.length < 3) {
    return res.json({
      state: false,
      message: "string must be at least 3",
    });
  }

  const oldCarNumber = await CarNumbers.find({ carNumber: carNumber, exitTime: null });

  if (oldCarNumber.length < 1) {
    return res.json({
      state: false,
      message: "this car did not enter to our parking",
    });
  }

  let now = new Date().toISOString();
  let hours = getHours(oldCarNumber[0].createdAt, now);
  let price = getPrice(hours).toFixed(2);

  let sendData = {
    uniqueId: oldCarNumber[0]._id,
    price: price,
    enteredData: oldCarNumber[0].createdAt,
    today: now,
  };

  res.json({
    state: true,
    message: "succes",
    data: sendData,
  });
});

// payment for car and exit
app.put("/exit-car", async (req, res) => {
  const oldCarNumber = await CarNumbers.findOne({ _id: req.body.unique });

  if (oldCarNumber.exitTime) {
    return res.json({
      state: false,
      message: "bu mashina to'lov qilgan",
    });
  }

  let points;
  if (oldCarNumber.pointId.length) {
    points = await Points.findOne({ _id: oldCarNumber.pointId });
  }

  let newPointId;

  if (points) {
    let objResult = {
      points: points.points < 25 ? points.points + 1 : 25,
    };

    await Points.findByIdAndUpdate(points._id, { $set: objResult }, { new: true });
  } else {
    let objResult = {
      car_ids: [oldCarNumber._id],
      carNumber: oldCarNumber.carNumber,
      points: 1,
      usedTimes: 1,
    };
    const newCreatedPoint = await Points.create(objResult);
    newPointId = newCreatedPoint._id;
  }

  let objResult = {
    exitTime: new Date().toISOString(),
    price: req.body.price,
    paymentMethod: req.body.paymentMethod,
    pointId: newPointId,
  };

  const updatedCarNumber = await CarNumbers.findByIdAndUpdate(
    oldCarNumber._id,
    { $set: objResult },
    { new: true }
  );

  res.json({
    state: true,
    message: "to'lov amalga oshirildi",
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
});
