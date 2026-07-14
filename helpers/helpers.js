const HOURLY_RATE = 2000; // birinchi 24 soat uchun, so'm/soat
const EXTENDED_HOURLY_RATE = 1800; // 24 soatdan keyingi har bir soat uchun, so'm/soat
const EXTENDED_RATE_THRESHOLD_HOURS = 24;

function getPrice(hours, discount = 0) {
  let result = 0;

  if (hours > 0) {
    result =
      hours < EXTENDED_RATE_THRESHOLD_HOURS
        ? hours * HOURLY_RATE
        : hours * EXTENDED_HOURLY_RATE;
  }

  if (discount > 0) {
    result = result - (result * discount) / 100;
  }

  return result;
}

function getHours(entryDateStr, exitDateStr) {
  // Parse the date strings into Date objects
  const entryDate = new Date(entryDateStr);
  const exitDate = new Date(exitDateStr);

  // Calculate the time difference in milliseconds
  const timeDifferenceMs = exitDate - entryDate;

  // Convert milliseconds to hours
  const hours = timeDifferenceMs / (1000 * 60 * 60);

  return hours;
}

module.exports = { getPrice, getHours };
