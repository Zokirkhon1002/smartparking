const { CarNumbers } = require("../models/userModel");
const { Points } = require("../models/pointModel");
const { getHours, getPrice } = require("../helpers/helpers");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");

const isValidCarNumber = (carNumber) => typeof carNumber === "string" && carNumber.length >= 3;

// GET /cars
const getAllCars = asyncHandler(async (req, res) => {
  const carNumbersArr = await CarNumbers.find();
  if (carNumbersArr.length < 1) {
    return fail(res, "There is not any data!");
  }
  return ok(res, "success", carNumbersArr);
});

// GET /cars/:id
const getCarByNumber = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const carData = await CarNumbers.find({ carNumber: id });
  const pointData = await Points.findOne({ carNumber: id });

  if (carData.length < 1) {
    return fail(res, "There is not any data!");
  }

  return ok(res, "success", { carData, pointData });
});

// POST /cars
const createCar = asyncHandler(async (req, res) => {
  const carNumber = req.body.carNumber;

  if (!isValidCarNumber(carNumber)) {
    return fail(res, "string must be at least 3");
  }

  const oldCarNumber = await CarNumbers.findOne({ carNumber });

  if (oldCarNumber && !oldCarNumber.exitTime) {
    return fail(res, "bu mashina hali chiqib ketmadi!");
  }

  const points = await Points.findOne({ carNumber });

  // points => 1. object, 2. null
  const newCreatedCar = await CarNumbers.create({
    pointId: points ? points._id : null,
    price: 0,
    carNumber,
    paymentMethod: "",
    exitTime: "",
  });

  if (points) {
    const updatedPoints = await Points.findByIdAndUpdate(
      points._id,
      {
        $set: {
          usedTimes: points.usedTimes + 1,
          car_ids: [...points.car_ids, newCreatedCar._id],
        },
      },
      { new: true }
    );
    if (!updatedPoints) {
      return fail(res, "pointning update qilishda xatolik");
    }
  }

  return ok(res, "success");
});

// PUT /cars — get price and unique id
const getCarPrice = asyncHandler(async (req, res) => {
  const carNumber = req.body.carNumber;

  if (!isValidCarNumber(carNumber)) {
    return fail(res, "string must be at least 3");
  }

  const oldCarNumber = await CarNumbers.find({ carNumber, exitTime: null });

  if (oldCarNumber.length < 1) {
    return fail(res, "this car did not enter to our parking");
  }

  const now = new Date().toISOString();
  const hours = getHours(oldCarNumber[0].createdAt, now);
  const price = getPrice(hours).toFixed(2);

  return ok(res, "succes", {
    uniqueId: oldCarNumber[0]._id,
    price,
    enteredData: oldCarNumber[0].createdAt,
    today: now,
  });
});

// PUT /exit-car — payment for car and exit
const exitCar = asyncHandler(async (req, res) => {
  const oldCarNumber = await CarNumbers.findOne({ _id: req.body.unique });

  if (!oldCarNumber) {
    return fail(res, "bunday mashina topilmadi");
  }

  if (oldCarNumber.exitTime) {
    return fail(res, "bu mashina to'lov qilgan");
  }

  const points = oldCarNumber.pointId
    ? await Points.findOne({ _id: oldCarNumber.pointId })
    : null;

  let newPointId;

  if (points) {
    await Points.findByIdAndUpdate(
      points._id,
      { $set: { points: points.points < 25 ? points.points + 1 : 25 } },
      { new: true, runValidators: true }
    );
  } else {
    const newCreatedPoint = await Points.create({
      car_ids: [oldCarNumber._id],
      carNumber: oldCarNumber.carNumber,
      points: 1,
      usedTimes: 1,
    });
    newPointId = newCreatedPoint._id;
  }

  await CarNumbers.findByIdAndUpdate(
    oldCarNumber._id,
    {
      $set: {
        exitTime: new Date().toISOString(),
        price: req.body.price,
        paymentMethod: req.body.paymentMethod,
        pointId: newPointId,
      },
    },
    { new: true }
  );

  return ok(res, "to'lov amalga oshirildi");
});

module.exports = {
  getAllCars,
  getCarByNumber,
  createCar,
  getCarPrice,
  exitCar,
};
