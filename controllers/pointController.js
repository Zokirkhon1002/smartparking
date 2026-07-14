const { Points } = require("../models/pointModel");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");

// GET /points
const getAllPoints = asyncHandler(async (req, res) => {
  const pointsArr = await Points.find();
  if (pointsArr.length < 1) {
    return fail(res, "There is not any data!");
  }

  return ok(res, "success", pointsArr);
});

module.exports = {
  getAllPoints,
};
