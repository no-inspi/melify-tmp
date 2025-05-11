cd /Users/charlieapcher/Documents/melify/melify-tmp/gcp/process_mails

export URI_MONGODB="mongodb://127.0.0.1:27017"
export DATABASE_NAME="melifydevelopment"
/Users/charlieapcher/Documents/melify/melify-tmp/gcp/process_mails/.venv/bin/functions-framework --target=retrieve_calendar_events_entry_point --port=8086 --debug