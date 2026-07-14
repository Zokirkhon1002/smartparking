// wraps an async route handler so thrown/rejected errors are caught
// and turned into a consistent 500 response, without repeating try/catch everywhere
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    res.status(500).json({
      state: false,
      message: "server error",
      msg: err.message,
    });
  });
};

module.exports = asyncHandler;
