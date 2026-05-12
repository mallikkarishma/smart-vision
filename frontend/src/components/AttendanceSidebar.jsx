import { useEffect, useState } from "react";
import axios from "axios";

const AttendanceSidebar = () => {
  const [records, setRecords] = useState({});

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get("http://localhost:8000/attendance");
        setRecords(res.data);
      } catch (err) {
        console.error("Attendance fetch error:", err);
      }
    };
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 3000);
    return () => clearInterval(interval);
  }, []);

  const entries = Object.entries(records);

  return (
    <div style={{
      width: 220,
      background: "#0e0a18",
      borderRadius: 14,
      border: "0.5px solid #1e1530",
      padding: "14px",
      maxHeight: "80vh",
      overflowY: "auto",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <p style={{
        fontSize: 9, fontWeight: 700,
        letterSpacing: 2, color: "#2d1f4a",
        textTransform: "uppercase", margin: "0 0 12px",
      }}>
        Today's Attendance
      </p>

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#2d1f4a", fontSize: 12 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
          No one logged yet
        </div>
      ) : (
        entries.map(([name, data]) => (
          <div key={name} style={{
            display: "flex", gap: 10, alignItems: "center",
            padding: "10px", marginBottom: 8,
            borderRadius: 10,
            background: "rgba(124,58,237,0.06)",
            border: "0.5px solid rgba(124,58,237,0.2)",
          }}>
            {/* Thumbnail */}
            <div style={{
              width: 42, height: 42, borderRadius: 8,
              overflow: "hidden", flexShrink: 0,
              background: "#0a0714",
              border: "0.5px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {data.thumbnail ? (
                <img
                  src={`data:image/jpeg;base64,${data.thumbnail}`}
                  alt={name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 18 }}>🫥</span>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: "#a78bfa",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>
                {name}
              </div>
              <div style={{ fontSize: 10, color: "#2d1f4a", marginTop: 3 }}>
                In: {data.first_seen}
              </div>
              <div style={{ fontSize: 10, color: "#2d1f4a" }}>
                Last: {data.last_seen}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AttendanceSidebar;