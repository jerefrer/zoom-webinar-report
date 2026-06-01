// Synthetic Zoom attendee-report CSVs for unit tests (no real PII).
// Day 1 (05/12/2026): Alice rejoins (same email) → 1 person, 30 + 55 = 85 min.
// Bob → 100 min. Two unique attendees: France, Germany.
export const DAY1_MAIN_CSV = `﻿Attendee Report
Report generated time,05/20/2026 10:00:00 AM
Topic,Webinar ID,Actual Start Time,Actual Duration (minutes),Total Users,Unique Viewers
Test Webinar,123 456 7890,05/12/2026 09:00:00 AM,120,3,3
Host Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Yes,Host One,host@example.com,05/12/2026 09:00:00 AM,05/12/2026 11:00:00 AM,120,No,United States
Panelist Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Yes,Panelist One,panel@example.com,05/12/2026 09:00:00 AM,05/12/2026 11:00:00 AM,120,No,Canada
Attendee Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Yes,Alice,alice@example.com,05/12/2026 09:00:00 AM,05/12/2026 09:30:00 AM,30,Yes,France
Yes,Alice,alice@example.com,05/12/2026 09:35:00 AM,05/12/2026 10:30:00 AM,55,Yes,France
Yes,Bob,bob@example.com,05/12/2026 09:00:00 AM,05/12/2026 10:40:00 AM,100,Yes,Germany
`;

// Day 2 (05/13/2026): Carol → 70 min, Spain.
export const DAY2_MAIN_CSV = `﻿Attendee Report
Report generated time,05/20/2026 10:05:00 AM
Topic,Webinar ID,Actual Start Time,Actual Duration (minutes),Total Users,Unique Viewers
Test Webinar,123 456 7890,05/13/2026 09:00:00 AM,90,1,1
Host Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Yes,Host One,host@example.com,05/13/2026 09:00:00 AM,05/13/2026 10:30:00 AM,90,No,United States
Panelist Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Attendee Details
Attended,User Name (Original Name),Email,Join Time,Leave Time,Time in Session (minutes),Is Guest,Country/Region Name
Yes,Carol,carol@example.com,05/13/2026 09:00:00 AM,05/13/2026 10:10:00 AM,70,Yes,Spain
`;

export const NOT_A_ZOOM_REPORT_CSV = `name,score
foo,1
bar,2
`;
