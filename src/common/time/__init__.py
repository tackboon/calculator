from datetime import datetime, timezone, timedelta

def convert_timestamp_to_datetime(timestamp: float, tz_offset: str) -> str:
  # Split the offset into hours and minutes
  hours_minutes = tz_offset.split(":")
  offset_hours = int(hours_minutes[0])
  offset_minutes = int(hours_minutes[1])

  # Create a timezone object using the parsed offset
  tz_info = timezone(timedelta(hours=offset_hours, minutes=offset_minutes))

  # Convert the timestamp to a UTC datetime object
  utc_datetime = datetime.fromtimestamp(timestamp, tz_info)
  
  # Convert UTC datetime to string format
  return utc_datetime.strftime("%Y-%m-%d %H:%M:%S %Z")
