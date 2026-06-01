import React, { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import { getMyProfile, updateMyProfile } from "../services/employeeService";
import { formatDate } from "../utils/dateFormat";

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Profile = () => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [form, setForm]         = useState({ fullName: "", phone: "", address: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfile();
        setData(res);
        setForm({ fullName: res?.fullName || "", phone: res?.phone || "", address: res?.address || "" });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleStartEdit = () => { setSuccess(""); setError(""); setIsEditing(true); };

  const handleCancelEdit = () => {
    setIsEditing(false); setSuccess(""); setError("");
    setForm({ fullName: data?.fullName || "", phone: data?.phone || "", address: data?.address || "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setSuccess(""); setError("");
      const updated = await updateMyProfile(form);
      setData(updated);
      setForm({ fullName: updated?.fullName || "", phone: updated?.phone || "", address: updated?.address || "" });
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const staticFields = [
    { label: "User ID",       value: data?.id },
    { label: "Employee Code", value: data?.employeeCode },
    { label: "Email",         value: data?.email },
    { label: "Role",          value: data?.role },
    { label: "Department",    value: data?.department },
    { label: "Designation",   value: data?.designation },
    { label: "Join Date",     value: formatDate(data?.joinDate) },
  ];

  const editableFields = [
    { label: "Full Name", value: data?.fullName },
    { label: "Phone",     value: data?.phone },
    { label: "Address",   value: data?.address },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>View and update your personal information</p>
      </div>

      {success && (
        <div className="alert alert-success">
          <IconCheck /> {success}
        </div>
      )}
      {error && !loading && (
        <div className="alert alert-error">
          <IconAlert /> {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <Loader message="Loading profile…" />
        ) : (
          <>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p className="section-label" style={{ margin: 0 }}>Account Details</p>
              {!isEditing && (
                <button className="btn-ghost" type="button" onClick={handleStartEdit}>
                  <IconEdit /> Edit Profile
                </button>
              )}
            </div>

            {/* Static fields */}
            <div className="profile-grid" style={{ marginBottom: 16 }}>
              {staticFields.map(({ label, value }) => (
                <div className="profile-field" key={label}>
                  <div className="profile-field-label">{label}</div>
                  <div className="profile-field-value">{value || "—"}</div>
                </div>
              ))}
            </div>

            {/* Editable fields — read mode */}
            {!isEditing && (
              <>
                <p className="section-label" style={{ marginBottom: 12, marginTop: 8 }}>Contact & Personal</p>
                <div className="profile-grid">
                  {editableFields.map(({ label, value }) => (
                    <div className="profile-field" key={label}>
                      <div className="profile-field-label">{label}</div>
                      <div className="profile-field-value">{value || "—"}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Edit form */}
            {isEditing && (
              <div className="profile-edit-form">
                <p className="section-label">Edit Contact & Personal</p>

                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName" name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone</label>
                  <input
                    id="phone" name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="address">Address</label>
                  <textarea
                    id="address" name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Your address"
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="profile-actions">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <IconCheck />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <IconX /> Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
