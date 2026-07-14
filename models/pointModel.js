const { Schema, model } = require("mongoose");

const pointSchema = new Schema(
  {
    car_ids: {
      type: [{ type: Schema.Types.ObjectId, ref: "carnumbers" }],
      default: [],
      required: true,
    },
    carNumber: {
      type: String,
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      default: 0,
      max: 25,
    },
    usedTimes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Points = model("points", pointSchema);

module.exports = { Points };
