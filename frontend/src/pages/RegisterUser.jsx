import React, { useRef, useState, useEffect } from "react";
import useAuth            from "../hooks/useAuth";
import { registerFace, retryEmployeeSync }   from "../services/userService";
import { releaseBackendCamera, videoFeedUrl } from "../services/cameraService";
import PageWrapper        from "../components/layout/PageWrapper";

/* ── Tip card ── */
const Tip = ({ icon, title, desc }) => (
  <div style={s.tip}>
    <span style={s.tipIcon}>{icon}</span>
    <div>
      <p style={s.tipTitle}>{title}</p>
      <p style={s.tipDesc}>{desc}</p>
    </div>
  </div>
);

/* ── Steps indicator ── */
const Steps = ({ current }) => {
  const steps = ["Position Face", "Enter Name", "Capture & Save"];
  return (
    <div style={s.steps}>
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div style={s.step}>
              <div style={{
                ...s.stepDot,
                background: done   ? "var(--accent)"
                           : active ? "var(--accent-dim)"
                           : "var(--surface-3)",
                border: `1px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
                color:  done || active ? "var(--accent)" : "var(--text-muted)",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                ...s.stepLabel,
                color: active ? "var(--text-primary)" : done ? "var(--accent)" : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ ...s.stepLine, background: done ? "var(--accent)" : "var(--border)" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Main page ── */
const RegisterUser = () => {
  useAuth();

  const [name,        setName]        = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState(null);
  const [error,       setError]       = useState(null);
  const [syncWarning, setSyncWarning] = useState(null);
  const [lastSyncPayload, setLastSyncPayload] = useState(null);
  const [syncDetails, setSyncDetails] = useState(null);
  const [retryingSync, setRetryingSync] = useState(false);
  const [camStatus,   setCamStatus]   = useState("loading"); // loading | live | error
  const [streamKey,   setStreamKey]   = useState(0);
  const [useWebcam,   setUseWebcam]   = useState(true);     // true = browser webcam, false = backend stream

  const imgRef    = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /* Browser webcam */
  useEffect(() => {
    const setup = async () => {
      if (!useWebcam) {
        stopWebcam();
        setCamStatus("loading");
        return;
      }

      // Release backend camera lock before opening browser webcam.
      try {
        await releaseBackendCamera();
      } catch {
        // Ignore release errors; browser webcam may still open.
      }
      startWebcam();
    };

    setup();
    return () => {
      stopWebcam();
      Promise.resolve(releaseBackendCamera?.()).catch(() => {});
    };
  }, [useWebcam]);

  const startWebcam = async () => {
    setCamStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCamStatus("live");
      }
    } catch {
      setCamStatus("error");
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const retryCamera = async () => {
    setCamStatus("loading");
    setStreamKey((k) => k + 1);
    if (useWebcam) {
      try {
        await releaseBackendCamera();
      } catch {
        // continue best effort
      }
      startWebcam();
    }
  };

  const handleRetrySync = async () => {
    if (!lastSyncPayload) {
      return;
    }

    setRetryingSync(true);
    setError(null);
    try {
      const data = await retryEmployeeSync(lastSyncPayload);
      const syncInfo = data?.employee_sync;
      if (syncInfo?.status === "ok") {
        const registration = data?.registration || {};
        const temporaryPassword = registration?.temporaryPassword || syncInfo?.temporaryPassword || syncInfo?.payload?.password || "";
        setSyncDetails({
          userId: registration?.userId || syncInfo?.userId || "",
          employeeCode: registration?.employeeCode || syncInfo?.employeeCode || syncInfo?.payload?.employeeCode || "",
          email: registration?.email || syncInfo?.email || syncInfo?.payload?.email || "",
          role: registration?.role || syncInfo?.role || "employee",
          department: registration?.department || syncInfo?.department || "",
          temporaryPassword,
          passwordGenerated: Boolean(registration?.passwordGenerated ?? syncInfo?.passwordGenerated),
        });
        setMessage(
          `${data.message || "Employee sync completed."} Employee login synced: ${syncInfo.employeeCode} / ${syncInfo.email}`
        );
        setSyncWarning(null);
        setLastSyncPayload(null);
      } else {
        setSyncWarning(`Employee login sync failed: ${syncInfo?.reason || "Unknown sync error"}`);
        setLastSyncPayload(syncInfo?.payload || lastSyncPayload);
      }
    } catch (err) {
      setSyncWarning(err?.response?.data?.error || err?.response?.data?.message || "Retry sync failed.");
    } finally {
      setRetryingSync(false);
    }
  };

  const handleCopySyncDetails = async () => {
    if (!syncDetails) return;

    const lines = [
      `User ID: ${syncDetails.userId || "—"}`,
      `Employee Code: ${syncDetails.employeeCode || "—"}`,
      `Email: ${syncDetails.email || "—"}`,
      `Role: ${syncDetails.role || "employee"}`,
      `Department: ${syncDetails.department || "—"}`,
      `Temporary Password: ${syncDetails.temporaryPassword || "—"}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setMessage("Employee login details copied to clipboard.");
    } catch {
      setSyncWarning("Copy to clipboard failed. You can still read the details on screen.");
    }
  };

  /* Derive step */
  const step = camStatus !== "live" ? 0 : name.trim() ? 2 : 1;

  /* Register */
  const captureAndRegister = async () => {
    if (!name.trim()) { setError("Please enter a name"); return; }
    if (camStatus !== "live") { setError("Camera is not ready yet."); return; }
    setLoading(true); setError(null); setMessage(null); setSyncWarning(null); setLastSyncPayload(null); setSyncDetails(null);

    let image;
    if (useWebcam) {
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      image = canvas.toDataURL("image/jpeg");
    } else {
      const canvas = document.createElement("canvas");
      const img    = imgRef.current;
      canvas.width  = img.naturalWidth  || img.width;
      canvas.height = img.naturalHeight || img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      image = canvas.toDataURL("image/jpeg");
    }

    try {
      const data = await registerFace(name.trim().toLowerCase(), image, {
        employeeCode,
        email,
        password,
        department,
        designation,
        phone,
        address,
      });
      const registration = data?.registration || {};
      const syncInfo = data?.employee_sync;
      if (syncInfo?.status === "ok") {
        const temporaryPassword = registration?.temporaryPassword || syncInfo?.temporaryPassword || syncInfo?.payload?.password || "";
        setSyncDetails({
          userId: registration?.userId || syncInfo?.userId || "",
          employeeCode: registration?.employeeCode || syncInfo?.employeeCode || syncInfo?.payload?.employeeCode || "",
          email: registration?.email || syncInfo?.email || syncInfo?.payload?.email || "",
          role: registration?.role || syncInfo?.role || "employee",
          department: registration?.department || syncInfo?.department || "",
          temporaryPassword,
          passwordGenerated: Boolean(registration?.passwordGenerated ?? syncInfo?.passwordGenerated),
        });
        setMessage(
          `${data.message || "User registered successfully."} Employee login synced: ${syncInfo.employeeCode} / ${syncInfo.email}`
        );
        setSyncWarning(null);
        setLastSyncPayload(null);
      } else if (syncInfo?.status === "failed") {
        const temporaryPassword = registration?.temporaryPassword || syncInfo?.temporaryPassword || syncInfo?.payload?.password || "";
        setSyncDetails({
          userId: registration?.userId || syncInfo?.userId || "",
          employeeCode: registration?.employeeCode || syncInfo?.employeeCode || syncInfo?.payload?.employeeCode || "",
          email: registration?.email || syncInfo?.email || syncInfo?.payload?.email || "",
          role: registration?.role || syncInfo?.role || "employee",
          department: registration?.department || syncInfo?.department || "",
          temporaryPassword,
          passwordGenerated: Boolean(registration?.passwordGenerated ?? syncInfo?.passwordGenerated),
        });
        setMessage(data.message || "User registered.");
        setSyncWarning(`Employee login sync failed: ${syncInfo.reason}`);
        setLastSyncPayload({
          ...(syncInfo?.payload || {}),
          userId: registration?.userId || syncInfo?.userId || "",
          name: name.trim().toLowerCase(),
          employeeCode,
          email,
          password,
          department,
          designation,
          phone,
          address,
        });
      } else {
        setSyncDetails(null);
        setMessage(data.message || "User registered successfully.");
        setSyncWarning(null);
        setLastSyncPayload(null);
      }
      setName("");
      setEmployeeCode("");
      setEmail("");
      setPassword("");
      setDepartment("");
      setDesignation("");
      setPhone("");
      setAddress("");
    } catch (err) {
      setError(err?.response?.data?.error || "Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Register New Employee"
      subtitle="Capture face and enrol employee into the recognition system"
    >
      <div style={s.layout}>

        {/* ── LEFT: Camera + form ── */}
        <div style={s.mainCard}>

          {/* Steps */}
          <div style={s.stepsWrap}>
            <Steps current={step} />
          </div>

          {/* Camera source toggle */}
          <div style={s.toggleRow}>
            <span style={s.toggleLabel}>Camera source</span>
            <div style={s.toggle}>
              <button
                style={{ ...s.toggleBtn, ...(useWebcam  ? s.toggleActive : {}) }}
                onClick={() => { setUseWebcam(true);  setCamStatus("loading"); }}
              >
                Browser webcam
              </button>
              <button
                style={{ ...s.toggleBtn, ...(!useWebcam ? s.toggleActive : {}) }}
                onClick={() => { setUseWebcam(false); setCamStatus("loading"); }}
              >
                Backend stream
              </button>
            </div>
          </div>

          {/* Camera frame */}
          <div style={s.cameraFrame}>

            {/* Status pill */}
            <div style={s.statusPill}>
              <span style={{
                ...s.statusDot,
                background: camStatus === "live"    ? "var(--accent)"
                           : camStatus === "error"  ? "var(--danger)"
                           : "var(--warning)",
                boxShadow: camStatus === "live" ? "0 0 7px var(--accent)" : "none",
              }} />
              <span style={s.statusText}>
                {camStatus === "live"    ? "Camera Ready"
               : camStatus === "error"  ? "Camera Error"
               : "Connecting..."}
              </span>
            </div>

            {/* Loading overlay */}
            {camStatus === "loading" && (
              <div style={s.camOverlay}>
                <div style={s.scanLine} />
                <div style={{ textAlign: "center", zIndex: 2 }}>
                  <div style={s.camIcon}>◉</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
                    Starting camera...
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {camStatus === "error" && (
              <div style={s.camOverlay}>
                <span style={{ fontSize: "32px", color: "var(--danger)" }}>⊗</span>
                <p style={{ color: "var(--danger)", fontSize: "13px", marginTop: "10px", fontWeight: 600 }}>
                  Camera unavailable
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                  {useWebcam ? "Allow camera permission and retry" : "Ensure backend is running"}
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "14px" }} onClick={retryCamera}>
                  ↻ Retry
                </button>
              </div>
            )}

            {/* Browser webcam video */}
            {useWebcam && (
              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ ...s.cameraMedia, display: camStatus === "live" ? "block" : "none" }}
                onPlay={() => setCamStatus("live")}
              />
            )}

            {/* Backend stream img */}
            {!useWebcam && (
              <img
                key={streamKey}
                ref={imgRef}
                src={videoFeedUrl(`view=register&v=${streamKey}`)}
                alt="camera"
                style={{ ...s.cameraMedia, display: camStatus === "live" ? "block" : "none" }}
                onLoad={()  => setCamStatus("live")}
                onError={() => setCamStatus("error")}
              />
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Corner brackets */}
            {[
              { top: "10px",    left: "10px",  borderTop: "2px solid var(--accent)", borderLeft:  "2px solid var(--accent)" },
              { top: "10px",    right: "10px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" },
              { bottom: "10px", left: "10px",  borderBottom: "2px solid var(--accent)", borderLeft:  "2px solid var(--accent)" },
              { bottom: "10px", right: "10px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" },
            ].map((c, i) => (
              <div key={i} style={{ position: "absolute", width: "14px", height: "14px", pointerEvents: "none", ...c }} />
            ))}

            {/* Face guide overlay */}
            {camStatus === "live" && (
              <div style={s.faceGuide} />
            )}
          </div>

          {/* Name input */}
          <div style={s.formSection}>
            <div style={s.fieldGroup}>
              <label style={s.fieldLabel}>Employee Name</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>◎</span>
                <input
                  className="input"
                  style={{ paddingLeft: "38px" }}
                  type="text"
                  placeholder="e.g. karthick"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && captureAndRegister()}
                  disabled={loading}
                />
              </div>
              <p style={s.fieldHint}>
                Name will be stored in lowercase. Must match existing DB records.
              </p>
            </div>

            <div style={s.twoCol}>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Employee Code (optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. EMP1201"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Employee Email (optional)</label>
                <input
                  className="input"
                  type="email"
                  placeholder="e.g. name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={s.twoCol}>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Login Password (optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Default: Emp@12345"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <p style={s.fieldHint}>If provided: 8+ chars with uppercase, lowercase, number, special character.</p>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Department (optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={s.twoCol}>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Designation (optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Phone (optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.fieldLabel}>Address (optional)</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Chennai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Feedback */}
            {message && (
              <div style={s.successBox}>
                <span style={s.successIcon}>✓</span>
                <div>
                  <p style={s.successTitle}>Registration successful</p>
                  <p style={s.successDesc}>{message}</p>
                </div>
              </div>
            )}
            {error && (
              <div style={s.errorBox}>
                <span style={s.errorIcon}>!</span>
                <div>
                  <p style={s.errorTitle}>Registration failed</p>
                  <p style={s.errorDesc}>{error}</p>
                </div>
              </div>
            )}
            {syncWarning && (
              <div style={s.errorBox}>
                <span style={s.errorIcon}>⚠</span>
                <div style={{ flex: 1 }}>
                  <p style={s.errorTitle}>Sync warning</p>
                  <p style={s.errorDesc}>{syncWarning}</p>
                  {lastSyncPayload && (
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={handleRetrySync}
                      disabled={retryingSync}
                      style={{ marginTop: "10px" }}
                    >
                      {retryingSync ? "Retrying..." : "Retry Sync"}
                    </button>
                  )}
                </div>
              </div>
            )}
            {syncDetails && (
              <div style={s.syncBox}>
                <div style={s.syncHead}>
                  <p style={s.syncTitle}>Employee login ready</p>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={handleCopySyncDetails}>
                    Copy Details
                  </button>
                </div>
                <div style={s.syncGrid}>
                  <div>
                    <span style={s.syncLabel}>User ID</span>
                    <p style={s.syncValue}>{syncDetails.userId || "—"}</p>
                  </div>
                  <div>
                    <span style={s.syncLabel}>Employee Code</span>
                    <p style={s.syncValue}>{syncDetails.employeeCode || "—"}</p>
                  </div>
                  <div>
                    <span style={s.syncLabel}>Email</span>
                    <p style={s.syncValue}>{syncDetails.email || "—"}</p>
                  </div>
                  <div>
                    <span style={s.syncLabel}>Role</span>
                    <p style={s.syncValue}>{syncDetails.role || "employee"}</p>
                  </div>
                  <div>
                    <span style={s.syncLabel}>Department</span>
                    <p style={s.syncValue}>{syncDetails.department || "—"}</p>
                  </div>
                  <div>
                    <span style={s.syncLabel}>New Password</span>
                    <p style={s.syncValue}>{syncDetails.temporaryPassword || "—"}</p>
                  </div>
                </div>
                <p style={s.syncNote}>
                  {syncDetails.passwordGenerated
                    ? "A temporary password was generated and synced to the employee account."
                    : "The password you entered was synced to the employee account."}
                </p>
              </div>
            )}
            {/* Submit */}
            <button
              style={{ ...s.submitBtn, opacity: loading || camStatus !== "live" ? 0.6 : 1 }}
              onClick={captureAndRegister}
              disabled={loading || camStatus !== "live"}
            >
              {loading ? (
                <><div style={s.spinner} /> Registering...</>
              ) : (
                <>⊕ Capture &amp; Register</>
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Tips ── */}
        <div style={s.sidePanel}>
          <div style={s.sideCard}>
            <p style={s.sideTitle}>Registration Tips</p>
            <div style={s.tipList}>
              <Tip icon="◎" title="Good lighting"     desc="Ensure face is well-lit from the front. Avoid backlight or shadows." />
              <Tip icon="◉" title="Face the camera"   desc="Look directly at the camera for the best face encoding accuracy." />
              <Tip icon="○" title="Clear frame"       desc="Remove glasses, hats, or anything obstructing your face." />
              <Tip icon="▦" title="One face only"     desc="Make sure only one face is visible in the camera frame." />
              <Tip icon="▲" title="Stable position"   desc="Keep still while the capture is being processed." />
            </div>
          </div>

          <div style={s.sideCard}>
            <p style={s.sideTitle}>How it works</p>
            <div style={s.howList}>
              {[
                ["Capture",  "A frame is taken from the camera stream"],
                ["Detect",   "Face is located in the captured image"],
                ["Encode",   "128-point face encoding is generated"],
                ["Save",     "Encoding + name stored for recognition"],
              ].map(([step, desc], i) => (
                <div key={step} style={s.howItem}>
                  <div style={s.howNum}>{i + 1}</div>
                  <div>
                    <p style={s.howTitle}>{step}</p>
                    <p style={s.howDesc}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
};

export default RegisterUser;

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = {

  layout: {
    display:             "grid",
    gridTemplateColumns: "1fr 320px",
    gap:                 "20px",
    alignItems:          "start",
  },

  /* Main card */
  mainCard: {
    background:   "var(--surface-1)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow:     "hidden",
    display:      "flex",
    flexDirection:"column",
  },

  /* Steps */
  stepsWrap: {
    padding:      "18px 24px",
    borderBottom: "1px solid var(--border)",
    background:   "var(--surface-2)",
  },
  steps: {
    display:    "flex",
    alignItems: "center",
    gap:        "0",
  },
  step: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:            "5px",
  },
  stepDot: {
    width:          "26px",
    height:         "26px",
    borderRadius:   "50%",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       "11px",
    fontFamily:     "var(--font-display)",
    fontWeight:     "700",
    transition:     "all 0.2s",
  },
  stepLabel: {
    fontSize:   "10.5px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  stepLine: {
    flex:       1,
    height:     "1px",
    minWidth:   "20px",
    marginBottom:"15px",
    transition: "background 0.2s",
  },

  /* Camera source toggle */
  toggleRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "12px 20px",
    borderBottom:   "1px solid var(--border)",
  },
  toggleLabel: {
    fontFamily: "var(--font-display)",
    fontSize:   "11px",
    fontWeight: "600",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color:      "var(--text-muted)",
  },
  toggle: {
    display:      "flex",
    background:   "var(--surface-2)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    padding:      "3px",
    gap:          "2px",
  },
  toggleBtn: {
    background:   "transparent",
    border:       "none",
    padding:      "5px 12px",
    borderRadius: "var(--r-sm)",
    fontSize:     "12px",
    fontFamily:   "var(--font-body)",
    color:        "var(--text-muted)",
    cursor:       "pointer",
    transition:   "all 0.15s",
    whiteSpace:   "nowrap",
  },
  toggleActive: {
    background: "var(--surface-3)",
    color:      "var(--text-primary)",
    fontWeight: "500",
  },

  /* Camera frame */
  cameraFrame: {
    position:       "relative",
    background:     "#020810",
    minHeight:      "340px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    overflow:       "hidden",
  },
  statusPill: {
    position:       "absolute",
    top:            "12px",
    left:           "50%",
    transform:      "translateX(-50%)",
    display:        "flex",
    alignItems:     "center",
    gap:            "7px",
    background:     "rgba(0,0,0,0.72)",
    backdropFilter: "blur(10px)",
    padding:        "5px 14px",
    borderRadius:   "var(--r-pill)",
    border:         "1px solid var(--border)",
    zIndex:         10,
    whiteSpace:     "nowrap",
  },
  statusDot: {
    width:        "7px",
    height:       "7px",
    borderRadius: "50%",
    flexShrink:   0,
  },
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
    color:      "var(--text-secondary)",
  },
  camOverlay: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    width:          "100%",
    height:         "340px",
    position:       "relative",
    overflow:       "hidden",
  },
  scanLine: {
    position:   "absolute",
    left:       0,
    width:      "100%",
    height:     "2px",
    background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
    opacity:    0.3,
    animation:  "scan-line 3s linear infinite",
    zIndex:     1,
  },
  camIcon: {
    fontSize:     "40px",
    color:        "rgba(0,212,168,0.25)",
    marginBottom: "4px",
    animation:    "glow-pulse 2.5s ease infinite",
    zIndex:       2,
  },
  cameraMedia: {
    width:     "100%",
    minHeight: "340px",
    objectFit: "cover",
    display:   "block",
  },
  faceGuide: {
    position:     "absolute",
    top:          "50%",
    left:         "50%",
    transform:    "translate(-50%, -50%)",
    width:        "160px",
    height:       "200px",
    border:       "1px dashed rgba(0,212,168,0.3)",
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    pointerEvents:"none",
    zIndex:       3,
  },

  /* Form section */
  formSection: {
    padding:       "20px 24px",
    display:       "flex",
    flexDirection: "column",
    gap:           "14px",
  },
  fieldGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           "5px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },
  fieldLabel: {
    fontFamily:    "var(--font-display)",
    fontSize:      "11px",
    fontWeight:    "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color:         "var(--text-muted)",
  },
  inputWrap: {
    position: "relative",
    display:  "flex",
    alignItems:"center",
  },
  inputIcon: {
    position:     "absolute",
    left:         "12px",
    fontSize:     "14px",
    color:        "var(--text-muted)",
    pointerEvents:"none",
    zIndex:       1,
  },
  fieldHint: {
    fontSize:  "11.5px",
    color:     "var(--text-muted)",
    marginTop: "3px",
  },

  /* Feedback */
  successBox: {
    display:      "flex",
    alignItems:   "flex-start",
    gap:          "12px",
    padding:      "13px 16px",
    background:   "var(--accent-dim)",
    border:       "1px solid var(--accent-border)",
    borderRadius: "var(--r-md)",
  },
  successIcon: {
    fontSize:   "18px",
    color:      "var(--accent)",
    flexShrink: 0,
    marginTop:  "1px",
  },
  successTitle: {
    fontSize:   "13px",
    fontWeight: "600",
    color:      "var(--accent)",
    marginBottom:"2px",
  },
  successDesc: {
    fontSize: "12px",
    color:    "var(--text-secondary)",
  },
  errorBox: {
    display:      "flex",
    alignItems:   "flex-start",
    gap:          "12px",
    padding:      "13px 16px",
    background:   "var(--danger-dim)",
    border:       "1px solid var(--danger-border)",
    borderRadius: "var(--r-md)",
  },
  errorIcon: {
    fontSize:   "16px",
    color:      "var(--danger)",
    flexShrink: 0,
    marginTop:  "1px",
  },
  errorTitle: {
    fontSize:   "13px",
    fontWeight: "600",
    color:      "var(--danger)",
    marginBottom:"2px",
  },
  errorDesc: {
    fontSize: "12px",
    color:    "var(--text-secondary)",
  },

  syncBox: {
    display: "grid",
    gap: "10px",
    padding: "14px 16px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
  },
  syncHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  syncTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  syncGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
  },
  syncLabel: {
    display: "block",
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "4px",
  },
  syncValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-primary)",
    wordBreak: "break-word",
  },
  syncNote: {
    fontSize: "12px",
    color: "var(--text-muted)",
    margin: 0,
  },

  /* Submit */
  submitBtn: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "8px",
    width:          "100%",
    padding:        "13px",
    background:     "var(--accent)",
    color:          "#050D1C",
    border:         "none",
    borderRadius:   "var(--r-md)",
    fontFamily:     "var(--font-body)",
    fontSize:       "15px",
    fontWeight:     "700",
    cursor:         "pointer",
    transition:     "all 0.18s",
    boxShadow:      "0 4px 16px rgba(0,212,168,0.2)",
  },
  spinner: {
    width:        "16px",
    height:       "16px",
    border:       "2px solid rgba(5,13,28,0.25)",
    borderTop:    "2px solid #050D1C",
    borderRadius: "50%",
    animation:    "spin 0.65s linear infinite",
    flexShrink:   0,
  },

  /* Side panel */
  sidePanel: {
    display:       "flex",
    flexDirection: "column",
    gap:           "16px",
  },
  sideCard: {
    background:   "var(--surface-1)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding:      "18px 20px",
  },
  sideTitle: {
    fontFamily:   "var(--font-display)",
    fontSize:     "13px",
    fontWeight:   "700",
    color:        "var(--text-primary)",
    marginBottom: "14px",
    paddingBottom:"10px",
    borderBottom: "1px solid var(--border)",
  },

  /* Tips */
  tipList: { display: "flex", flexDirection: "column", gap: "12px" },
  tip: {
    display:    "flex",
    gap:        "10px",
    alignItems: "flex-start",
  },
  tipIcon: {
    fontSize:   "14px",
    color:      "var(--accent)",
    flexShrink: 0,
    marginTop:  "2px",
    width:      "16px",
    textAlign:  "center",
  },
  tipTitle: {
    fontSize:   "12.5px",
    fontWeight: "600",
    color:      "var(--text-primary)",
    fontFamily: "var(--font-display)",
    marginBottom:"2px",
  },
  tipDesc: {
    fontSize:   "11.5px",
    color:      "var(--text-muted)",
    lineHeight: 1.55,
  },

  /* How it works */
  howList: { display: "flex", flexDirection: "column", gap: "10px" },
  howItem: {
    display:    "flex",
    gap:        "10px",
    alignItems: "flex-start",
  },
  howNum: {
    width:          "22px",
    height:         "22px",
    borderRadius:   "50%",
    background:     "var(--accent-dim)",
    border:         "1px solid var(--accent-border)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       "10px",
    fontFamily:     "var(--font-display)",
    fontWeight:     "700",
    color:          "var(--accent)",
    flexShrink:     0,
  },
  howTitle: {
    fontSize:     "12.5px",
    fontWeight:   "600",
    color:        "var(--text-primary)",
    fontFamily:   "var(--font-display)",
    marginBottom: "1px",
  },
  howDesc: {
    fontSize:  "11.5px",
    color:     "var(--text-muted)",
    lineHeight:1.5,
  },
};



