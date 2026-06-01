from datetime import datetime

def test_home_route(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "Smart Attendance backend running"}


def test_health_route(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_attendance_stats_route(client, monkeypatch):
    def fake_stats():
        return {"total_today": 0, "currently_present": 0}

    monkeypatch.setattr(
        "backend.app.routes.attendance_routes.get_stats_today",
        fake_stats,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get("/attendance/stats", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.get_json() == {"total_today": 0, "currently_present": 0}


def test_login_invalid_credentials_returns_401(client, monkeypatch):
    def fake_admin_lookup(_username):
        return {"password": "correct-password"}

    monkeypatch.setattr(
        "backend.app.routes.auth_routes.get_admin_by_username",
        fake_admin_lookup,
    )

    resp = client.post(
        "/api/login",
        json={"username": "admin", "password": "wrong-password"},
    )

    assert resp.status_code == 401
    assert resp.get_json() == {"error": "Invalid credentials"}


def test_login_missing_fields_returns_400(client):
    resp = client.post("/api/login", json={"username": "", "password": ""})

    assert resp.status_code == 400
    assert resp.get_json() == {"error": "Username and password required"}


def test_camera_status_shape(client):
    resp = client.get("/camera/status")
    assert resp.status_code == 401


def test_camera_status_shape_authorized(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )
    resp = client.get("/camera/status", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200

    data = resp.get_json()
    assert isinstance(data.get("available"), bool)
    assert isinstance(data.get("opened"), bool)
    assert isinstance(data.get("message"), str)


def test_admin_required_blocks_missing_token(client):
    resp = client.get("/users")

    assert resp.status_code == 401
    assert resp.get_json() == {"error": "Unauthorized"}


def test_users_route_returns_list(client, monkeypatch):
    def fake_users():
        return [
            {"id": 1, "name": "karthick", "created_at": "2026-04-15T10:00:00"}
        ]

    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_all_users",
        fake_users,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get("/users", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200

    data = resp.get_json()
    assert isinstance(data, list)
    assert data[0]["name"] == "karthick"

def test_user_details_route_returns_user_and_summary(client, monkeypatch):
    def fake_get_user_by_id(_user_id):
        return {"id": 1, "name": "karthick", "created_at": "2026-04-15T10:00:00"}

    def fake_get_user_attendance_summary(_user_id):
        return {"total_records": 12, "today_records": 1, "currently_present": 0}

    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_by_id",
        fake_get_user_by_id,
    )
    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_attendance_summary",
        fake_get_user_attendance_summary,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get("/users/1", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200

    data = resp.get_json()
    assert data["user"]["id"] == 1
    assert data["user"]["name"] == "karthick"
    assert data["summary"]["total_records"] == 12
    assert data["summary"]["today_records"] == 1
    assert data["summary"]["currently_present"] == 0

def test_user_details_route_returns_404_when_missing(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_by_id",
        lambda _user_id: None,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get("/users/99999", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 404
    assert resp.get_json() == {"error": "User not found"}


def test_update_compensation_route_returns_200(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_by_id",
        lambda _user_id: {"id": 1, "name": "karthick"},
    )
    monkeypatch.setattr(
        "backend.app.routes.user_routes.update_user_compensation",
        lambda **_kwargs: True,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.put(
        "/users/1/compensation",
        json={"monthly_salary": 50000, "pf_percent": 12, "savings_percent": 10},
        headers={"Authorization": "Bearer test-token"},
    )
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "Compensation updated"}


def test_update_compensation_rejects_invalid_values(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_by_id",
        lambda _user_id: {"id": 1, "name": "karthick"},
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.put(
        "/users/1/compensation",
        json={"monthly_salary": -1, "pf_percent": 12, "savings_percent": 10},
        headers={"Authorization": "Bearer test-token"},
    )

    assert resp.status_code == 400
    assert resp.get_json() == {"error": "monthly_salary cannot be negative"}


def test_clear_encodings_route_returns_200(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.admin_routes.clear_all_encodings",
        lambda: None,
    )
    monkeypatch.setattr(
        "backend.app.routes.admin_routes.reload_encodings",
        lambda: None,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.post("/admin/encodings/clear", headers={"Authorization": "Bearer test-token"})

    assert resp.status_code == 200
    assert resp.get_json() == {"message": "All face encodings cleared"}


def test_reset_attendance_route_returns_200(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.admin_routes.delete_all_attendance_records",
        lambda: 5,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.post("/admin/attendance/reset", headers={"Authorization": "Bearer test-token"})

    assert resp.status_code == 200
    assert resp.get_json() == {
        "message": "All attendance records deleted",
        "deleted": 5,
    }


def test_delete_user_route_returns_200(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.user_routes.get_user_by_id",
        lambda _user_id: {"id": 1, "name": "karthick"},
    )
    monkeypatch.setattr(
        "backend.app.routes.user_routes.delete_user_by_id",
        lambda _user_id: True,
    )
    monkeypatch.setattr(
        "backend.app.routes.user_routes.remove_encodings_for_name",
        lambda _name: None,
    )
    monkeypatch.setattr(
        "backend.app.routes.user_routes.reload_encodings",
        lambda: None,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.delete("/users/1", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "User 'karthick' deleted"}


def test_build_employee_sync_payload_generates_temporary_password():
    from backend.app.services.registration_service import build_employee_sync_payload

    payload = build_employee_sync_payload("Jane Doe", 5, {})

    assert payload["employeeCode"] == "EMP1005"
    assert payload["email"] == "jane.doe.5@company.com"
    assert payload["passwordGenerated"] is True
    assert payload["password"].startswith("Emp@")
    assert len(payload["password"]) > 8


def test_build_employee_sync_payload_uses_provided_password():
    from backend.app.services.registration_service import build_employee_sync_payload

    payload = build_employee_sync_payload(
        "Jane Doe",
        5,
        {
            "employeeCode": "EMP7777",
            "email": "jane@example.com",
            "password": "Temp@1234",
        },
    )

    assert payload["employeeCode"] == "EMP7777"
    assert payload["email"] == "jane@example.com"
    assert payload["password"] == "Temp@1234"
    assert payload["passwordGenerated"] is False


def test_build_registration_details_includes_employee_hand_off():
    from backend.app.services.registration_service import build_registration_details

    details = build_registration_details(
        7,
        {
            "employeeCode": "EMP1007",
            "email": "jane@example.com",
            "password": "Temp@1234",
            "department": "Engineering",
            "designation": "Developer",
            "passwordGenerated": True,
        },
    )

    assert details == {
        "userId": 7,
        "role": "employee",
        "department": "Engineering",
        "designation": "Developer",
        "employeeCode": "EMP1007",
        "email": "jane@example.com",
        "temporaryPassword": "Temp@1234",
        "passwordGenerated": True,
    }


def test_attendance_export_route_returns_excel(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.report_routes.get_all_attendance",
        lambda: [
            {
                "id": 1,
                "user_id": 1,
                "name": "karthick",
                "login_time": datetime(2026, 5, 1, 9, 0, 0),
                "logout_time": datetime(2026, 5, 1, 18, 0, 0),
            }
        ],
    )
    monkeypatch.setattr(
        "backend.app.routes.report_routes.get_attendance_by_date",
        lambda _from, _to: [],
    )
    monkeypatch.setattr(
        "backend.app.routes.report_routes.calculate_duration",
        lambda *_args: "09:00",
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get("/export", headers={"Authorization": "Bearer test-token"})

    assert resp.status_code == 200
    assert "attendance.xlsx" in resp.headers.get("Content-Disposition", "")


def test_payroll_summary_route_returns_rows(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.report_routes.get_payroll_summary",
        lambda **_kwargs: [
            {
                "user_id": 1,
                "employee_name": "karthick",
                "month": 5,
                "year": 2026,
                "working_days_in_month": 31,
                "present_days": 20,
                "worked_hours": 160,
                "monthly_salary": 50000,
                "gross_pay": 32258.06,
                "pf_percent": 12,
                "pf_deduction": 3870.97,
                "savings_percent": 10,
                "savings_deduction": 3225.81,
                "total_deductions": 7096.78,
                "net_pay": 25161.28,
                "payout_status": "pending",
                "paid_at": None,
                "payment_ref": None,
                "notes": None,
            }
        ],
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get(
        "/payroll/summary?year=2026&month=5",
        headers={"Authorization": "Bearer test-token"},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["count"] == 1
    assert data["rows"][0]["employee_name"] == "karthick"


def test_payroll_export_route_returns_excel(client, monkeypatch):
    monkeypatch.setattr(
        "backend.app.routes.report_routes.get_payroll_summary",
        lambda **_kwargs: [
            {
                "user_id": 1,
                "employee_name": "karthick",
                "month": 5,
                "year": 2026,
                "working_days_in_month": 31,
                "present_days": 20,
                "worked_hours": 160,
                "monthly_salary": 50000,
                "gross_pay": 32258.06,
                "pf_percent": 12,
                "pf_deduction": 3870.97,
                "savings_percent": 10,
                "savings_deduction": 3225.81,
                "total_deductions": 7096.78,
                "net_pay": 25161.28,
                "payout_status": "pending",
                "paid_at": None,
                "payment_ref": None,
                "notes": None,
            }
        ],
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.get(
        "/payroll/export?year=2026&month=5",
        headers={"Authorization": "Bearer test-token"},
    )

    assert resp.status_code == 200
    assert "payroll_2026_05.xlsx" in resp.headers.get("Content-Disposition", "")


def test_mark_payroll_paid_route_persists_status(client, monkeypatch):
    captured = {}

    def fake_mark_paid(**kwargs):
        captured.update(kwargs)
        return {
            "user_id": kwargs["user_id"],
            "year": kwargs["year"],
            "month": kwargs["month"],
            "payout_status": "processed",
            "paid_at": "2026-05-31T12:00:00",
            "payment_ref": kwargs.get("payment_ref"),
            "notes": kwargs.get("notes"),
        }

    monkeypatch.setattr(
        "backend.app.routes.report_routes.mark_payroll_paid",
        fake_mark_paid,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.post(
        "/payroll/mark-paid",
        json={
            "user_id": 1,
            "year": 2026,
            "month": 5,
            "payment_ref": "TXN-1001",
            "notes": "Paid via bank transfer",
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["data"]["payout_status"] == "processed"
    assert captured["payment_ref"] == "TXN-1001"
    assert captured["notes"] == "Paid via bank transfer"


def test_mark_payroll_pending_route_persists_status(client, monkeypatch):
    captured = {}

    def fake_mark_pending(**kwargs):
        captured.update(kwargs)

    monkeypatch.setattr(
        "backend.app.routes.report_routes.mark_payroll_pending",
        fake_mark_pending,
    )
    monkeypatch.setattr(
        "backend.app.middleware.auth_middleware.verify_admin_token",
        lambda _token: {"username": "admin", "role": "admin"},
    )

    resp = client.post(
        "/payroll/mark-pending",
        json={"user_id": 1, "year": 2026, "month": 5},
        headers={"Authorization": "Bearer test-token"},
    )

    assert resp.status_code == 200
    assert resp.get_json() == {"message": "Payroll moved to pending"}
    assert captured == {"user_id": 1, "year": 2026, "month": 5}
