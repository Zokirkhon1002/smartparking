const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    exitTime: {
      type: Date,
      required: false,
    },
    carNumber: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    pointId: {
      type: String,
      ref: "points",
      required: false,
    },
  },
  { timestamps: true }
);

const CarNumbers = model("carnumbers", userSchema);

module.exports = { CarNumbers };
