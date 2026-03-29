const ics = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTSTART:20260516T190000Z",
  "DTEND:20260516T230000Z",
  "SUMMARY:Graduation Celebration - George Mason University",
  "LOCATION:16856 Francis West Ln\\, Dumfries\\, VA 22026",
  "DESCRIPTION:Graduation party for GMU Class of 2026!",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

function downloadCalendar(e) {
  e.preventDefault();
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graduation-party.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("add-to-calendar").addEventListener("click", downloadCalendar);
document.querySelector(".calendar-link").addEventListener("click", downloadCalendar);
