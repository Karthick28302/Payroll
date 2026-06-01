import React from "react";

const Loader = ({ message = "Loading..." }) => (
  <div className="state-box">
    <div className="loading-dots">
      <span /><span /><span />
    </div>
    <p className="state-msg">{message}</p>
  </div>
);

export default Loader;
