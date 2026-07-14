const express = require("express");
const router = express.Router();
const {
  getAllCars,
  getCarByNumber,
  createCar,
  getCarPrice,
  exitCar,
} = require("../controllers/carController");

router.get("/cars", getAllCars);
router.get("/cars/:id", getCarByNumber);
router.post("/cars", createCar);
router.put("/cars", getCarPrice);
router.put("/exit-car", exitCar);

module.exports = router;
