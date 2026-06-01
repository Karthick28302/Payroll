import React, { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import { getMyEvents } from "../services/employeeService";
import { formatDate } from "../utils/dateFormat";

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const Events = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyEvents();
        setRows(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load events.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeRows = Array.isArray(rows) ? rows : [];

  const getDateParts = (dateStr) => {
    if (!dateStr) return { day: "—", mon: "—" };
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      mon: d.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
    };
  };

  return (
    <div>
      <div className="page-header">
        <h2>Events</h2>
        <p>Upcoming company events and announcements</p>
      </div>

      {loading ? (
        <div className="card"><Loader message="Loading events…" /></div>
      ) : error ? (
        <div className="alert alert-error"><IconAlert /> {error}</div>
      ) : safeRows.length === 0 ? (
        <div className="card">
          <div className="state-box">
            <div style={{ color: "var(--text-muted)", marginBottom: 10 }}><IconCalendar /></div>
            <p className="state-msg">No upcoming events at the moment.</p>
          </div>
        </div>
      ) : (
        <>
          <p className="section-label">{safeRows.length} Event{safeRows.length !== 1 ? "s" : ""}</p>
          <div className="events-list">
            {safeRows.map((row) => {
              const { day, mon } = getDateParts(row.event_date);
              return (
                <div className="event-card" key={row.id}>
                  {/* Date chip */}
                  <div className="event-date-chip">
                    <div className="event-date-day">{day}</div>
                    <div className="event-date-mon">{mon}</div>
                  </div>

                  {/* Body */}
                  <div className="event-body">
                    <div className="event-title">{row.title}</div>

                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
                      {row.event_time && (
                        <div className="event-meta">
                          <IconClock /> {row.event_time}
                        </div>
                      )}
                      {row.location && (
                        <div className="event-meta">
                          <IconMapPin /> {row.location}
                        </div>
                      )}
                      {!row.event_time && !row.location && (
                        <div className="event-meta">{formatDate(row.event_date)}</div>
                      )}
                    </div>

                    {row.description && (
                      <p className="event-desc">{row.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Events;
