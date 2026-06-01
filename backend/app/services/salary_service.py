import calendar
from datetime import date, datetime

from backend.app.database.db_connection import get_db_connection

PAYOUT_STATUS_VALUES = ("pending", "in_progress", "processed")


def ensure_payroll_tables():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS payroll_payouts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            payroll_year INT NOT NULL,
            payroll_month INT NOT NULL,
            payout_status ENUM('pending', 'in_progress', 'processed') NOT NULL DEFAULT 'pending',
            paid_at DATETIME NULL,
            payment_ref VARCHAR(100) NULL,
            notes VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_month (user_id, payroll_year, payroll_month),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )
    conn.commit()
    cur.close()
    conn.close()


def _period_bounds(year: int, month: int):
    start = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end = date(year, month, last_day)
    return start, end, last_day


def _safe_float(value):
    if value is None:
        return 0.0
    return float(value)


def get_payroll_summary(year: int, month: int, employee_name: str | None = None):
    ensure_payroll_tables()
    period_start, period_end, month_days = _period_bounds(year, month)

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    query = """
        SELECT
            u.id AS user_id,
            u.name AS employee_name,
            u.monthly_salary,
            u.pf_percent,
            u.savings_percent,
            COUNT(DISTINCT DATE(a.login_time)) AS present_days,
            p.id AS payout_id,
            p.payout_status,
            p.paid_at,
            p.payment_ref,
            p.notes,
            COALESCE(
                SUM(
                    CASE
                        WHEN a.login_time IS NOT NULL AND a.logout_time IS NOT NULL
                        THEN TIMESTAMPDIFF(SECOND, a.login_time, a.logout_time)
                        ELSE 0
                    END
                ),
                0
            ) AS worked_seconds
        FROM users u
        LEFT JOIN attendance a
            ON a.user_id = u.id
            AND DATE(a.login_time) BETWEEN %s AND %s
        LEFT JOIN payroll_payouts p
            ON p.user_id = u.id
            AND p.payroll_year = %s
            AND p.payroll_month = %s
    """
    params = [period_start.isoformat(), period_end.isoformat(), year, month]

    if employee_name:
        query += " WHERE LOWER(u.name) LIKE %s "
        params.append(f"%{employee_name.strip().lower()}%")

    query += """
        GROUP BY u.id, u.name, u.monthly_salary, u.pf_percent, u.savings_percent
                 , p.id, p.payout_status, p.paid_at, p.payment_ref, p.notes
        ORDER BY u.name ASC
    """

    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    summary_rows = []
    for row in rows:
        monthly_salary = _safe_float(row.get("monthly_salary"))
        pf_percent = _safe_float(row.get("pf_percent"))
        savings_percent = _safe_float(row.get("savings_percent"))
        present_days = int(row.get("present_days") or 0)
        worked_seconds = int(row.get("worked_seconds") or 0)

        daily_rate = monthly_salary / month_days if month_days else 0.0
        gross_pay = round(daily_rate * present_days, 2)
        pf_deduction = round(gross_pay * (pf_percent / 100), 2)
        savings_deduction = round(gross_pay * (savings_percent / 100), 2)
        total_deductions = round(pf_deduction + savings_deduction, 2)
        net_pay = round(max(0.0, gross_pay - total_deductions), 2)

        if row.get("payout_status") in PAYOUT_STATUS_VALUES:
            payout_status = row["payout_status"]
        elif year < datetime.now().year or (year == datetime.now().year and month < datetime.now().month):
            payout_status = "processed"
        else:
            payout_status = "pending" if present_days == 0 else "in_progress"

        summary_rows.append(
            {
                "user_id": row["user_id"],
                "employee_name": row["employee_name"],
                "month": month,
                "year": year,
                "working_days_in_month": month_days,
                "present_days": present_days,
                "worked_hours": round(worked_seconds / 3600, 2),
                "monthly_salary": round(monthly_salary, 2),
                "gross_pay": gross_pay,
                "pf_percent": round(pf_percent, 2),
                "pf_deduction": pf_deduction,
                "savings_percent": round(savings_percent, 2),
                "savings_deduction": savings_deduction,
                "total_deductions": total_deductions,
                "net_pay": net_pay,
                "payout_status": payout_status,
                "paid_at": row.get("paid_at").isoformat() if row.get("paid_at") else None,
                "payment_ref": row.get("payment_ref"),
                "notes": row.get("notes"),
            }
        )

    return summary_rows


def mark_payroll_paid(user_id: int, year: int, month: int, payment_ref: str | None = None, notes: str | None = None):
    ensure_payroll_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        INSERT INTO payroll_payouts (user_id, payroll_year, payroll_month, payout_status, paid_at, payment_ref, notes)
        VALUES (%s, %s, %s, 'processed', NOW(), %s, %s)
        ON DUPLICATE KEY UPDATE
            payout_status = VALUES(payout_status),
            paid_at = VALUES(paid_at),
            payment_ref = VALUES(payment_ref),
            notes = VALUES(notes)
        """,
        (user_id, year, month, payment_ref, notes),
    )
    conn.commit()

    cur.execute(
        """
        SELECT user_id, payroll_year, payroll_month, payout_status, paid_at, payment_ref, notes
        FROM payroll_payouts
        WHERE user_id = %s AND payroll_year = %s AND payroll_month = %s
        """,
        (user_id, year, month),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {
        "user_id": row["user_id"],
        "year": row["payroll_year"],
        "month": row["payroll_month"],
        "payout_status": row["payout_status"],
        "paid_at": row["paid_at"].isoformat() if row and row.get("paid_at") else None,
        "payment_ref": row.get("payment_ref") if row else None,
        "notes": row.get("notes") if row else None,
    }


def mark_payroll_pending(user_id: int, year: int, month: int):
    ensure_payroll_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO payroll_payouts (user_id, payroll_year, payroll_month, payout_status, paid_at, payment_ref, notes)
        VALUES (%s, %s, %s, 'pending', NULL, NULL, NULL)
        ON DUPLICATE KEY UPDATE
            payout_status = 'pending',
            paid_at = NULL,
            payment_ref = NULL,
            notes = NULL
        """,
        (user_id, year, month),
    )
    conn.commit()
    cur.close()
    conn.close()
