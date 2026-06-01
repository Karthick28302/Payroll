import React, { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import PageWrapper from "../components/layout/PageWrapper";
import {
  getCameraStatus,
  getCameraRecordings,
  getRecordingStatus,
  startRecording,
  stopRecording,
  videoFeedUrl,
} from "../services/cameraService";

function LiveMonitoring() {
  useAuth();
  const [recording, setRecording] = useState(false);
  const [recordingInfo, setRecordingInfo] = useState("");
  const [recordings, setRecordings] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [feedNonce, setFeedNonce] = useState(() => Date.now());
  const [statusMeta, setStatusMeta] = useState(null);
  const retryAttemptsRef = useRef(0);
  const retryTimerRef = useRef(null);

  const loadRecordingData = async () => {
    try {
      const recStatus = await getRecordingStatus();
      setRecording(Boolean(recStatus?.recording));
      const rows = await getCameraRecordings(10);
      setRecordings(rows || []);
    } catch {
      // keep UI resilient
    }
  };

  useEffect(() => {
    loadRecordingData();
    const statusPoll = setInterval(async () => {
      try {
        const info = await getCameraStatus();
        setStatusMeta(info || null);
      } catch {
        // best effort
      }
    }, 5000);

    return () => {
      clearInterval(statusPoll);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const scheduleRetry = () => {
    retryAttemptsRef.current += 1;
    const delay = Math.min(1000 * (2 ** (retryAttemptsRef.current - 1)), 8000);
    setStatus("reconnecting");
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      setFeedNonce(Date.now());
      setStatus("connecting");
    }, delay);
  };

  const handleStartRecording = async () => {
    const res = await startRecording();
    setRecordingInfo(res?.message || "Recording started");
    await loadRecordingData();
  };

  const handleStopRecording = async () => {
    const res = await stopRecording();
    setRecordingInfo(res?.message || "Recording stopped");
    await loadRecordingData();
  };

  return (
    <PageWrapper
      title="Live Monitoring"
      subtitle="Camera stream and recording controls"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          {!recording ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleStartRecording}
            >
              Start Recording
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={handleStopRecording}>Stop Recording</button>
          )}
        </div>
      }
    >
      <div style={s.card}>
        <div style={s.cameraWrap}>
          <div style={s.statusPill}>
            <span style={{ ...s.statusDot, background: status === "live" ? "var(--accent)" : status === "error" ? "var(--danger)" : "var(--warning)" }} />
            <span style={s.statusText}>
              {status === "live" ? "Connected" : status === "reconnecting" ? "Reconnecting..." : status === "error" ? "Disconnected" : "Connecting..."}
            </span>
            {status === "error" ? (
              <button className="btn btn-secondary btn-sm" onClick={() => {
                retryAttemptsRef.current = 0;
                setFeedNonce(Date.now());
                setStatus("connecting");
              }}>
                Retry
              </button>
            ) : null}
          </div>

          {statusMeta ? (
            <div style={s.sourcePill}>
              {(statusMeta.fallback_in_use ? "Fallback" : "Primary")} - {statusMeta.current_stream_source || statusMeta.active_source || "unknown"}
            </div>
          ) : null}

          <img
            key={feedNonce}
            src={videoFeedUrl({
              view: "monitor",
              fps: 20,
              quality: 75,
              scale: 0.8,
              process_every: 2,
              cache_bust: feedNonce,
            })}
            alt="Live camera feed"
            style={s.camera}
            onLoad={() => {
              retryAttemptsRef.current = 0;
              setStatus("live");
            }}
            onError={() => {
              if (retryAttemptsRef.current >= 4) setStatus("error");
              else scheduleRetry();
            }}
          />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardHead}>
          <span style={s.cardTitle}>Recent Recordings</span>
        </div>
        {recordingInfo ? <p style={s.infoText}>{recordingInfo}</p> : null}
        {recordings.length === 0 ? (
          <p style={s.emptyText}>No recordings yet.</p>
        ) : (
          <div style={s.listWrap}>
            {recordings.map((row) => (
              <div key={row.id} style={s.listRow}>
                <span style={s.rowPrimary}>{row.source_name || "Camera"}</span>
                <span style={s.rowSecondary}>{row.started_at ? new Date(row.started_at).toLocaleString("en-IN") : "-"}</span>
                <span style={s.badge}>{row.recording_status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default LiveMonitoring;

const s = {
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow: "hidden",
  },
  cameraWrap: {
    position: "relative",
    background: "#020810",
    minHeight: "380px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: "100%",
    minHeight: "380px",
    objectFit: "cover",
    display: "block",
    imageRendering: "auto",
  },
  statusPill: {
    position: "absolute",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "rgba(0,0,0,0.72)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-pill)",
    padding: "5px 12px",
    zIndex: 5,
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  sourcePill: {
    position: "absolute",
    top: "46px",
    left: "50%",
    transform: "translateX(-50%)",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    background: "rgba(0,0,0,0.58)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-pill)",
    padding: "3px 10px",
    zIndex: 5,
  },
  cardHead: {
    borderBottom: "1px solid var(--border)",
    padding: "12px 16px",
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  infoText: {
    padding: "12px 16px 0",
    color: "var(--text-secondary)",
    fontSize: "12px",
  },
  emptyText: {
    padding: "18px 16px",
    color: "var(--text-muted)",
    fontSize: "13px",
  },
  listWrap: {
    display: "flex",
    flexDirection: "column",
  },
  listRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "10px",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    padding: "12px 16px",
  },
  rowPrimary: {
    color: "var(--text-primary)",
    fontWeight: "600",
    fontSize: "13px",
  },
  rowSecondary: {
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  badge: {
    background: "var(--info-dim)",
    border: "1px solid var(--info-border)",
    color: "var(--info)",
    borderRadius: "var(--r-pill)",
    padding: "3px 9px",
    fontSize: "11px",
    textTransform: "capitalize",
  },
};
