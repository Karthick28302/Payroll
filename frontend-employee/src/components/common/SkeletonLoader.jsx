import React from "react";

const SkeletonLoader = ({ variant = "line", count = 1, width = "100%", height = "16px", className = "" }) => {
  const variants = {
    line: { height: "16px", borderRadius: "4px", marginBottom: "12px" },
    card: { height: "200px", borderRadius: "var(--r)", marginBottom: "16px" },
    "table-row": { height: "48px", borderRadius: "8px", marginBottom: "8px" },
    avatar: { height: "40px", width: "40px", borderRadius: "50%" },
    "text-block": { height: "80px", borderRadius: "var(--r-sm)", marginBottom: "16px" },
  };

  const variant_style = variants[variant];

  const skeleton_items = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      style={{
        ...s.skeleton,
        width: variant === "avatar" ? variant_style.width : width,
        height: variant_style.height,
        borderRadius: variant_style.borderRadius,
        marginBottom: i === count - 1 ? 0 : variant_style.marginBottom,
      }}
      className={`${className} shimmer`}
    />
  ));

  return variant === "avatar" ? (
    <div style={s.avatarContainer}>{skeleton_items}</div>
  ) : (
    <div style={s.container}>{skeleton_items}</div>
  );
};

export default SkeletonLoader;

const s = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },

  avatarContainer: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  skeleton: {
    background: `linear-gradient(
      90deg,
      var(--bg-card) 0%,
      var(--bg-card-hover) 50%,
      var(--bg-card) 100%
    )`,
    backgroundSize: "1000px 100%",
    animation: "shimmer 1.5s linear infinite",
    display: "block",
  },
};
