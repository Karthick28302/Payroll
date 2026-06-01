import React from "react";
import Navbar from "./Navbar";

/**
 * PageWrapper
 * Wraps every protected page with:
 *  - Sticky top Navbar
 *  - Consistent page padding + max-width
 *  - Fade-up entrance animation
 *  - Optional full-width mode (no max-width constraint)
 *
 * Usage:
 *   <PageWrapper title="Dashboard" subtitle="Live overview">
 *     <YourContent />
 *   </PageWrapper>
 *
 *   <PageWrapper title="Live Monitor" fullWidth>
 *     <YourContent />
 *   </PageWrapper>
 */
const PageWrapper = ({
  children,
  title,
  subtitle,
  actions,
  fullWidth = false,
  noPad    = false,
}) => (
  <div style={s.shell}>

    {/* ── Sticky top bar ── */}
    <Navbar />

    {/* ── Scrollable content area ── */}
    <div style={{ ...s.content, padding: noPad ? 0 : "var(--page-pad, 36px)", maxWidth: fullWidth ? "none" : "1440px" }}>

      {/* ── Page header (optional) ── */}
      {(title || actions) && (
        <div style={s.header} className="page-header">
          <div>
            {title && <h1 style={s.title} className="page-header__title">{title}</h1>}
            {subtitle && <p style={s.subtitle} className="page-header__subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div style={s.actions} className="page-header__actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* ── Page body ── */}
      <div style={s.body}>
        {children}
      </div>

    </div>
  </div>
);

export default PageWrapper;

const s = {
  shell: {
    display:       "flex",
    flexDirection: "column",
    minHeight:     "100vh",
    background:    "var(--bg)",
  },
  content: {
    flex:      1,
    width:     "100%",
    animation: "fadeInUp var(--dur-slow) var(--ease-out) both",
  },
  header: {
    display:        "flex",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    marginBottom:   "28px",
    flexWrap:       "wrap",
    gap:            "16px",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize:   "26px",
    fontWeight: "800",
    color:      "var(--text-primary)",
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize:  "13.5px",
    color:     "var(--text-secondary)",
    marginTop: "5px",
  },
  actions: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
    flexWrap:   "wrap",
  },
  body: {
    display:       "flex",
    flexDirection: "column",
    gap:           "20px",
  },
};