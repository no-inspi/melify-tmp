import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

// ----------------------------------------------------------------------

dayjs.extend(duration);
dayjs.extend(relativeTime);

/**
 * Docs: https://day.js.org/docs/en/display/format
 */
export const formatStr = {
  dateTime: 'DD MMM YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
};

export function today(format) {
  return dayjs(new Date()).startOf('day').format(format);
}

// ----------------------------------------------------------------------

/** output: 17 Apr 2022 12:00 am
 */
export function fDateTime(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format ?? formatStr.dateTime) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 17 Apr 2022
 */
export function fDate(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format ?? formatStr.date) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 12:00 am
 */
export function fTime(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format ?? formatStr.time) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 1713250100
 */
export function fTimestamp(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).valueOf() : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: a few seconds, 2 years
 */
export function fToNow(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).toNow(true) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsBetween(inputDate, startDate, endDate) {
  if (!inputDate || !startDate || !endDate) {
    return false;
  }

  const formattedInputDate = fTimestamp(inputDate);
  const formattedStartDate = fTimestamp(startDate);
  const formattedEndDate = fTimestamp(endDate);

  if (formattedInputDate && formattedStartDate && formattedEndDate) {
    return formattedInputDate >= formattedStartDate && formattedInputDate <= formattedEndDate;
  }

  return false;
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsAfter(startDate, endDate) {
  return dayjs(startDate).isAfter(endDate);
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsSame(startDate, endDate, units) {
  if (!startDate || !endDate) {
    return false;
  }

  const isValid = dayjs(startDate).isValid() && dayjs(endDate).isValid();

  if (!isValid) {
    return 'Invalid time value';
  }

  return dayjs(startDate).isSame(endDate, units ?? 'year');
}

// ----------------------------------------------------------------------

/** output:
 * Same day: 26 Apr 2024
 * Same month: 25 - 26 Apr 2024
 * Same month: 25 - 26 Apr 2024
 * Same year: 25 Apr - 26 May 2024
 */
export function fDateRangeShortLabel(startDate, endDate, initial) {
  const isValid = dayjs(startDate).isValid() && dayjs(endDate).isValid();

  const isAfter = fIsAfter(startDate, endDate);

  if (!isValid || isAfter) {
    return 'Invalid time value';
  }

  let label = `${fDate(startDate)} - ${fDate(endDate)}`;

  if (initial) {
    return label;
  }

  const isSameYear = fIsSame(startDate, endDate, 'year');
  const isSameMonth = fIsSame(startDate, endDate, 'month');
  const isSameDay = fIsSame(startDate, endDate, 'day');

  if (isSameYear && !isSameMonth) {
    label = `${fDate(startDate, 'DD MMM')} - ${fDate(endDate)}`;
  } else if (isSameYear && isSameMonth && !isSameDay) {
    label = `${fDate(startDate, 'DD')} - ${fDate(endDate)}`;
  } else if (isSameYear && isSameMonth && isSameDay) {
    label = `${fDate(endDate)}`;
  }

  return label;
}

/** output: '2024-05-28T05:55:31+00:00'
 */
export function fAdd({
  years = 0,
  months = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}) {
  const result = dayjs()
    .add(
      dayjs.duration({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
      })
    )
    .format();

  return result;
}

/** output: '2024-05-28T05:55:31+00:00'
 */
export function fSub({
  years = 0,
  months = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}) {
  const result = dayjs()
    .subtract(
      dayjs.duration({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
      })
    )
    .format();

  return result;
}

/**
 * Formats date range in the style "When jeu 8mai 2025 18:30 - 19h30"
 *
 * @param {string} startTimeISO - ISO date string for start time (e.g. "2025-05-09T20:30:00+02:00")
 * @param {string} endTimeISO - ISO date string for end time (e.g. "2025-05-09T21:30:00+02:00")
 * @param {string} locale - Locale to use for formatting (default: 'fr-FR')
 * @returns {string} Formatted date range string
 */
export function formatEventDateRange(startTimeISO, endTimeISO, locale = 'fr-FR') {
  if (!startTimeISO || !endTimeISO) {
    return '';
  }

  try {
    // Parse ISO strings to Date objects
    const startDate = new Date(startTimeISO);
    const endDate = new Date(endTimeISO);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return '';
    }

    // Get day of week in French (e.g., "jeu" for Thursday)
    const dayOfWeek = startDate.toLocaleDateString(locale, { weekday: 'short' }).toLowerCase();

    // Get day and month (e.g., "8mai")
    const day = startDate.getDate();
    const month = startDate.toLocaleDateString(locale, { month: 'short' }).toLowerCase();

    // Get year
    const year = startDate.getFullYear();

    // Get start time (e.g., "18:30")
    const startTime = startDate.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // For end time, check if it's on the same day
    const sameDay =
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    // Get end time (e.g., "19h30")
    const endTime = endDate
      .toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(':', 'h');

    // If not same day, include full date for end time
    if (!sameDay) {
      const endDayOfWeek = endDate.toLocaleDateString(locale, { weekday: 'short' }).toLowerCase();
      const endDay = endDate.getDate();
      const endMonth = endDate.toLocaleDateString(locale, { month: 'short' }).toLowerCase();
      const endYear = endDate.getFullYear();

      return `${dayOfWeek} ${day}${month} ${year} ${startTime} - ${endDayOfWeek} ${endDay}${endMonth} ${endYear} ${endTime}`;
    }

    // Same day format
    return `${dayOfWeek} ${day}${month} ${year} ${startTime} - ${endTime}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid date format';
  }
}
