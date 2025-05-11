import { endpoints, postFetcher } from 'src/utils/axios';

export async function postUpdateCalendarEvent({ email, response, eventId }) {
  console.log(email, response, eventId);
  const URL =
    email && response && eventId
      ? [
          endpoints.calendar.updateEventStatus,
          {
            email,
            response,
            eventId,
          },
        ]
      : null;
  let responseStatus = '';
  console.log('URL', URL);

  if (URL != null) {
    responseStatus = await postFetcher(URL);
    console.log(responseStatus);
  } else {
    responseStatus = null;
  }

  return responseStatus;
}
