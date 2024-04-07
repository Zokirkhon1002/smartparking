function getPrice(hours, discount = 0) {
  let result = 0;
  const oneHourWon = 2000;

  if (hours > 0 && hours < 24) {
    result = hours * oneHourWon;
  } else {
    result = hours * (oneHourWon - 200);
  }
  if(discount > 0){
    let onePrecent = result / 100;
    let minusPrice = onePrecent * discount;
    result = result - minusPrice;
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
