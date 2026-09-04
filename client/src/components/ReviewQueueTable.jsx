import React from "react";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReviewQueueTable({
  records,
  activeFilter,
  onFilterChange,
  selectedRecord,
  onSelectRecord,
}) {
  return (
    <div className="queue-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">REVIEW QUEUE</p>
          <h2>Decisions, not guesses</h2>
        </div>

        <div className="filters">
          <button
            className={`filter ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("all")}
          >
            All
          </button>
          <button
            className={`filter ${activeFilter === "Cleared" ? "active" : ""}`}
            onClick={() => onFilterChange("Cleared")}
          >
            Matched
          </button>
          <button
            className={`filter ${activeFilter === "Anomaly" ? "active" : ""}`}
            onClick={() => onFilterChange("Anomaly")}
          >
            Review
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Value</th>
              <th>Decision</th>
              <th>Evidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="recordsBody">
            {records.map((record) => {
              const isSelected = selectedRecord?.id === record.id;
              const isMatch = record.status === "Cleared";

              return (
                <tr
                  key={record.id}
                  className={`record-row ${isSelected ? "selected-row" : ""}`}
                >
                  <td>
                    <span className="record-id">{record.id}</span>
                    <small className="record-type">{record.type}</small>
                  </td>
                  <td className="record-amount">{formatINR(record.amount)}</td>
                  <td>
                    <span
                      className={`decision-badge ${
                        isMatch ? "Cleared" : "Anomaly"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="evidence-score">{record.evidence}% evidence</td>
                  <td>
                    <button
                      className={`inspect-button ${isSelected ? "active" : ""}`}
                      onClick={() => onSelectRecord(record)}
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
