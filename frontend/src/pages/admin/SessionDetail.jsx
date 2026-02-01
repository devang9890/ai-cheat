import { useEffect, useState } from "react";
import axios from "axios";

const SessionDetail = ({ sessionId, onBack }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/admin/session/${sessionId}`)
      .then((res) => setLogs(res.data));
  }, [sessionId]);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1 bg-gray-300 rounded"
      >
        ← Back
      </button>

      {logs.map((log, i) => (
        <div key={i} className="bg-white p-3 rounded shadow mb-2">
          <p><b>Time:</b> {new Date(log.createdAt).toLocaleTimeString()}</p>
          <p>Risk: {log.riskLevel}</p>
          <p>Score: {log.cheatingScore}</p>
          <p>Looking Away: {log.lookingAway ? "YES" : "NO"}</p>
          <p>Tab Switches: {log.tabSwitches}</p>
          <p>Warnings: {log.warnings}</p>
        </div>
      ))}
    </div>
  );
};

export default SessionDetail;
