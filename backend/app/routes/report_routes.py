from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
import pandas as pd

from backend.app.models.attendance_model import get_all_attendance, get_attendance_by_date
from backend.app.services.attendance_service import calculate_duration
from backend.app.services.salary_service import (
    get_payroll_summary,
    mark_payroll_paid,
    mark_payroll_pending,
)
from backend.app.middleware.auth_middleware import admin_required

report_bp = Blueprint("reports", __name__)


@report_bp.route("/export", methods=["GET"])
@admin_required
def export_attendance():
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    if from_date and to_date:
        records = get_attendance_by_date(from_date, to_date)
    else:
        records = get_all_attendance()

    if not records:
        return jsonify({"message": "No data to export"}), 404

    for record in records:
        record["duration"] = calculate_duration(record["login_time"], record["logout_time"])
        record["login_time"] = record["login_time"].isoformat() if record["login_time"] else None
        record["logout_time"] = record["logout_time"].isoformat() if record["logout_time"] else None

    df = pd.DataFrame(records)
    df.drop(columns=["id"], errors="ignore", inplace=True)

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="attendance.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@report_bp.route("/payroll/summary", methods=["GET"])
@admin_required
def payroll_summary():
    today = pd.Timestamp.now()
    year = int(request.args.get("year", today.year))
    month = int(request.args.get("month", today.month))
    employee = (request.args.get("employee") or "").strip() or None

    rows = get_payroll_summary(year=year, month=month, employee_name=employee)
    return jsonify(
        {
            "month": month,
            "year": year,
            "count": len(rows),
            "rows": rows,
        }
    )


@report_bp.route("/payroll/export", methods=["GET"])
@admin_required
def export_payroll():
    today = pd.Timestamp.now()
    year = int(request.args.get("year", today.year))
    month = int(request.args.get("month", today.month))
    employee = (request.args.get("employee") or "").strip() or None

    rows = get_payroll_summary(year=year, month=month, employee_name=employee)
    if not rows:
        return jsonify({"message": "No payroll data to export"}), 404

    df = pd.DataFrame(rows)
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=f"payroll_{year}_{month:02d}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@report_bp.route("/payroll/mark-paid", methods=["POST"])
@admin_required
def payroll_mark_paid():
    body = request.json or {}
    user_id = body.get("user_id")
    year = body.get("year")
    month = body.get("month")
    payment_ref = (body.get("payment_ref") or "").strip() or None
    notes = (body.get("notes") or "").strip() or None

    if not user_id or not year or not month:
        return jsonify({"error": "user_id, year and month are required"}), 400

    result = mark_payroll_paid(
        user_id=int(user_id),
        year=int(year),
        month=int(month),
        payment_ref=payment_ref,
        notes=notes,
    )
    return jsonify({"message": "Payroll marked as paid", "data": result})


@report_bp.route("/payroll/mark-pending", methods=["POST"])
@admin_required
def payroll_mark_pending():
    body = request.json or {}
    user_id = body.get("user_id")
    year = body.get("year")
    month = body.get("month")

    if not user_id or not year or not month:
        return jsonify({"error": "user_id, year and month are required"}), 400

    mark_payroll_pending(
        user_id=int(user_id),
        year=int(year),
        month=int(month),
    )
    return jsonify({"message": "Payroll moved to pending"})
