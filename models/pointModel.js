const { Schema, model } = require("mongoose");

const pointSchema = new Schema(
  {
    // car_id: {
    //   type: Schema.Types.ObjectId,
    //   ref: "carnumbers",
    //   required: true,
    // },
    car_ids: {
      type: Array,
      default: [],
      required: true
    },
    carNumber: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
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
