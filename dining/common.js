const moment = require('moment');
const hourMinuteFormat = 'h:mma';
const dayOfWeekToken = 'ddd';

const RATHBONE_TITLE = 'Rathbone';
const CORT_TITLE = 'Cort';
const BRODHEAD_TITLE = 'Brodhead';
const residentDiningLocations = new Set([RATHBONE_TITLE, CORT_TITLE, BRODHEAD_TITLE]);

const getCurrentHour = () => moment().hours();
const getCurrentDay = () => moment().days();

const getStartAndEndTimeForToday = (hoursString) => {
  const timeRangesSeparator = ',';
  // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
  const timeRanges = hoursString.split(timeRangesSeparator).map(range => range.trim());
  const timeRangeForToday = extractTodaysDayAndTimeRangeFromTimeRanges(timeRanges);
  if (!timeRangeForToday) {
    return undefined;
  }
  return extractStartAndEndDateFromDayAndTimeRange(timeRangeForToday);
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm, Fri: 8:00am - 1:30pm
// Returns a single one of the above and it returns todays
const extractTodaysDayAndTimeRangeFromTimeRanges = (timeRanges) => {
  const todaysRange = timeRanges.find(timeRange => {
    const dayRangeAndTimeRangeSeparator = ':';
    const daysRange = timeRange.substring(0, timeRange.indexOf(dayRangeAndTimeRangeSeparator)).trim();
    const now = moment();
    const daySeparator = '-';
    const endDate = extractStartAndEndDateFromDayAndTimeRange(timeRange).endTime;
    const isOneDayBefore = (first, second) => first.isSame(moment(second).subtract(1, 'day'), 'day');
    const withinClosingTime = now.isBefore(endDate);
    if (daysRange.includes(daySeparator)) {
      const days = daysRange.split(daySeparator).map(day => day.substring(0, 3));
      const startDay = moment(days[0], dayOfWeekToken);
      const endDay = moment(days[1], dayOfWeekToken);
      if (endDay.isBefore(startDay)) endDay.add(1, 'week');
      const inclusiveDayToken = '[]';
      const lastDayInRangeCrossedPastMidnight = isOneDayBefore(endDay, endDate);
      const dayIsWithinRange = now.isBetween(startDay, endDay, 'day', inclusiveDayToken);
      console.log('first',lastDayInRangeCrossedPastMidnight);
      console.log('second',dayIsWithinRange);
      return dayIsWithinRange || (lastDayInRangeCrossedPastMidnight && withinClosingTime);
    } else {
      const day = moment(daysRange, dayOfWeekToken);
      const dayCrossedPastMidnight = isOneDayBefore(day, endDate);
      return now.isSame(day, 'day') || (dayCrossedPastMidnight && withinClosingTime);
    }
  });
  if (todaysRange) {
    return todaysRange.trim();
  }
  return todaysRange;
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm OR Fri: 8:00am - 1:30pm
const extractStartAndEndDateFromDayAndTimeRange = (timeRange) => {
  const days = extractStartAndEndDayFromDayAndTimeRange(timeRange);

  // 7:30am. For now we just assume we're being passed the current day's time range
  const { startTime, endTime } = extractStartAndEndTimeFromDayAndTimeRange(timeRange);
  adjustDatesBasedOnAmPm(startTime, endTime, days.endDay);

  return {
    startTime: startTime,
    endTime: endTime
  };
};

const extractStartAndEndDayFromDayAndTimeRange = (timeRange) => {
  const split = timeRange.split(' ').join('').split(':')[0].split('-');
  return {
    startDay: moment(split[0], dayOfWeekToken),
    endDay: moment(split[split.length - 1], dayOfWeekToken)
  };
};

const extractStartAndEndTimeFromDayAndTimeRange = (timeRange) => {
  const replaced =
    timeRange
      .replace('a.m.', 'am')
      .replace('p.m.', 'pm')
      .split(' ')
      .join('');

  // [7:30am, 8:30pm]
  const startOfTimeRangeIndex = replaced.indexOf(':') + 1;
  const times = replaced.substring(startOfTimeRangeIndex).split('-'); // separate into the start time and end time
  return {
    startTime: moment(times[0], hourMinuteFormat),
    endTime: moment(times[1], hourMinuteFormat)
  };
};

const adjustDatesBasedOnAmPm = (startTime, endTime, endDay) => {
  const isPm = (momentTime) => momentTime.hours() >= 12;
  const isAm = (momentTime) => momentTime.hours() < 12;

  if (isPm(startTime) && isAm(endTime)) {
    adjustDatesForPmAmCase(startTime, endTime);
  } else if (isAm(startTime) && isAm(endTime)) {
    adjustDatesForAmAmCase(startTime, endTime, endDay);
  } else if ((isPm(startTime) && isPm(endTime)) || (isAm(startTime) && isPm(endTime))) {
    startTime.day(getCurrentDay());
    endTime.day(getCurrentDay());
  }
};

const adjustDatesForPmAmCase = (startTime, endTime) => {
  const onAmSideOfRange = getCurrentHour() <= endTime.hours();
  const singleDayObject = {days: 1};
  if (onAmSideOfRange) {
    startTime.subtract(singleDayObject);
  }
  // on pm side of range
  else {
    endTime.add(singleDayObject);
  }
};

const adjustDatesForAmAmCase = (startTime, endTime, endDay) => {
  const movedPastEndTimeOfPreviousDay = moment().isSame(endDay, 'day');
  const onRightSideOfRange = getCurrentHour() <= endTime.hours() && !movedPastEndTimeOfPreviousDay;
  const singleDayObject = {days: 1};
  if (onRightSideOfRange) {
    startTime.subtract(singleDayObject);
  }
  // on left side of range
  else {
    endTime.add(singleDayObject);
  }
};

module.exports = {
  getStartAndEndTimeForToday: getStartAndEndTimeForToday,
  residentDiningLocations: residentDiningLocations,
  hourMinuteFormat: hourMinuteFormat,
  dayOfWeekToken: dayOfWeekToken
};
