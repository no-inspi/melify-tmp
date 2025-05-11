export const cloud_functions = [
  {
    name: 'Last 30 Days Batch',
    url:
      process.env.NEXT_PUBLIC_LAST_30_DAYS_URL || 'http://127.0.0.1:8082/last_30_days?health=check',
    status: 'loading',
    lastChecked: null,
    error: null,
  },
  {
    name: 'Retrieve Email by Labels',
    url:
      process.env.NEXT_PUBLIC_RETRIEVE_EMAIL_URL ||
      'http://127.0.0.1:8083/retrieve_email_by_labels_entry_point?health=check',
    status: 'loading',
    lastChecked: null,
    error: null,
  },
  {
    name: 'Transform Emails',
    url:
      process.env.NEXT_PUBLIC_RETRIEVE_EMAIL_URL ||
      'http://127.0.0.1:8084/transform_email?health=check',
    status: 'loading',
    lastChecked: null,
    error: null,
  },
  {
    name: 'Calendar Events',
    url:
      process.env.NEXT_PUBLIC_RETRIEVE_CALENDAR_URL ||
      'http://127.0.0.1:8085/retrieve_calendar_events_entry_point?health=check',
    status: 'loading',
    lastChecked: null,
    error: null,
  },
];
