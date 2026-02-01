import { useEffect, useState } from "react";
import axios from "axios";

const SessionsList = ({ onSelect }) => {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/admin/sessions"
    );
    setSessions(res.data);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const riskColor = (risk) => {
    if (risk === "HIGH_RISK") return "bg-red-500";
    if (risk === "SUSPICIOUS") return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div
          key={s._id}
          onClick={() => onSelect(s._id)}
          className="cursor-pointer p-4 bg-white rounded shadow flex justify-between"
        >
          <div>
            <p><b>Student:</b> {s.studentId}</p>
            <p><b>Exam:</b> {s.examId}</p>
          </div>

          <div className={`px-3 py-1 text-white rounded ${riskColor(s.riskLevel)}`}>
            {s.riskLevel}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionsList;
