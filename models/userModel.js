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
      type: Schema.Types.ObjectId,
      ref: "points",
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

// carNumber bo'yicha va ochiq sessiyani (carNumber + exitTime) qidirish tez bo'lishi uchun
userSchema.index({ carNumber: 1, exitTime: 1 });

const CarNumbers = model("carnumbers", userSchema);

module.exports = { CarNumbers };
