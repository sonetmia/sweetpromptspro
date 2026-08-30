const SEASONS = [
  {
    month: "January",
    events: [
      "New Year / Resolutions",
      "Winter Sports",
      "Healthy Living / Diets",
      "Martin Luther King Jr. Day",
    ],
  },
  {
    month: "February",
    events: ["Valentine's Day", "Black History Month", "Super Bowl / Sports", "Lunar New Year"],
  },
  {
    month: "March",
    events: ["St. Patrick's Day", "Spring Break", "Women's History Month", "Tax Season prep"],
  },
  { month: "April", events: ["Easter", "Earth Day", "Spring Cleaning", "Ramadan / Eid (varies)"] },
  { month: "May", events: ["Mother's Day", "Memorial Day", "Graduations", "Cinco de Mayo"] },
  { month: "June", events: ["Father's Day", "Pride Month", "Summer Vacations begin", "Weddings"] },
  {
    month: "July",
    events: [
      "Independence Day (US)",
      "Summer Activities",
      "Outdoor/Camping",
      "Back to School prep",
    ],
  },
  { month: "August", events: ["Back to School", "End of Summer", "College moving"] },
  {
    month: "September",
    events: ["Labor Day", "Fall/Autumn begins", "Oktoberfest", "Hispanic Heritage Month"],
  },
  {
    month: "October",
    events: ["Halloween", "Breast Cancer Awareness", "Fall Foliage", "Diwali (varies)"],
  },
  {
    month: "November",
    events: ["Thanksgiving", "Black Friday / Cyber Monday", "Veterans Day", "Movember"],
  },
  { month: "December", events: ["Christmas", "Hanukkah", "Winter Holidays", "New Year's Eve"] },
];

export default function SeasonalCalendar({
  setActiveTool,
}: {
  setActiveTool: (t: string) => void;
}) {
  // Try to find Opportunity Finder and auto-fill it if we had global state,
  // but for now we just link to it. Real implementation might use a context or URL param.

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Seasonal Opportunity Calendar
      </h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Stock agencies recommend uploading seasonal content 2-3 months in advance. Plan your shoots
        and generations here.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {SEASONS.map((s, i) => {
          const isCurrentMonth = new Date().getMonth() === i;
          return (
            <div
              key={i}
              style={{
                background: isCurrentMonth ? "rgba(245,132,31,0.1)" : "rgba(255,255,255,0.03)",
                border: isCurrentMonth
                  ? "1px solid rgba(245,132,31,0.3)"
                  : "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  color: isCurrentMonth ? "#f5841f" : "#fff",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {s.month}{" "}
                {isCurrentMonth && (
                  <span
                    style={{
                      fontSize: 12,
                      background: "#f5841f",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: 4,
                      marginLeft: 8,
                    }}
                  >
                    Current
                  </span>
                )}
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  flex: 1,
                  marginBottom: 16,
                }}
              >
                {s.events.map((e, j) => (
                  <li key={j}>{e}</li>
                ))}
              </ul>

              <button
                onClick={() => {
                  // Hacky but simple way to pre-fill the topic if we don't have context
                  // In a real app we'd use a context provider
                  setActiveTool("opportunity");
                }}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  color: "#a78bfa",
                  padding: "8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                Find Opportunities
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
