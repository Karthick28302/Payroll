from collections import defaultdict
from datetime import datetime, timedelta

from backend.app.database.db_connection import get_db_connection
from backend.app.models.user_model import get_all_users


def get_all_attendance():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT users.name, attendance.id,
               attendance.login_time, attendance.logout_time
        FROM attendance
        JOIN users ON attendance.user_id = users.id
        ORDER BY attendance.login_time DESC
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


def get_attendance_by_date(from_date: str, to_date: str):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT users.name, attendance.id,
               attendance.login_time, attendance.logout_time
        FROM attendance
        JOIN users ON attendance.user_id = users.id
        WHERE DATE(attendance.login_time) BETWEEN %s AND %s
        ORDER BY attendance.login_time DESC
    """, (from_date, to_date))
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


def get_today_record(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM attendance WHERE user_id = %s AND DATE(login_time) = CURDATE()",
        (user_id,)
    )
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result


def create_login(user_id: int, login_time):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO attendance (user_id, login_time) VALUES (%s, %s)",
        (user_id, login_time)
    )
    conn.commit()
    cur.close()
    conn.close()


def update_logout(attendance_id: int, logout_time):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE attendance SET logout_time = %s WHERE id = %s",
        (logout_time, attendance_id)
    )
    conn.commit()
    cur.close()
    conn.close()


def get_open_session(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id FROM attendance
        WHERE user_id = %s AND logout_time IS NULL
        ORDER BY login_time DESC
        LIMIT 1
    """, (user_id,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result


def get_stats_today():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT COUNT(*) AS total_today,
               SUM(logout_time IS NULL) AS currently_present
        FROM attendance
        WHERE DATE(login_time) = CURDATE()
    """)
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result


def get_attendance_analytics(from_date: str, to_date: str, late_after: str = "09:30:00"):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT
            users.id AS user_id,
            users.name,
            attendance.login_time,
            attendance.logout_time
        FROM attendance
        JOIN users ON attendance.user_id = users.id
        WHERE DATE(attendance.login_time) BETWEEN %s AND %s
        ORDER BY attendance.login_time ASC
        """,
        (from_date, to_date),
    )
    records = cur.fetchall()
    cur.close()
    conn.close()

    users = get_all_users()
    total_employees = len(users)
    late_threshold = datetime.strptime(late_after, "%H:%M:%S").time()
    now = datetime.now()

    daily_stats = defaultdict(lambda: {"users": set(), "late_users": set(), "worked_seconds": 0.0})
    employee_stats = defaultdict(lambda: {
        "employee_name": "",
        "present_days": 0,
        "late_arrivals": 0,
        "worked_seconds": 0.0,
    })

    for record in records:
        login_time = record.get("login_time")
        if not login_time:
            continue

        logout_time = record.get("logout_time") or now
        if isinstance(login_time, str):
            login_time = datetime.fromisoformat(login_time)
        if isinstance(logout_time, str):
            logout_time = datetime.fromisoformat(logout_time)

        user_id = record.get("user_id")
        employee_name = record.get("name") or ""
        day_key = login_time.date().isoformat()
        is_late = login_time.time() > late_threshold
        worked_seconds = max(0.0, (logout_time - login_time).total_seconds())

        daily_entry = daily_stats[day_key]
        daily_entry["users"].add(user_id)
        if is_late:
            daily_entry["late_users"].add(user_id)
        daily_entry["worked_seconds"] += worked_seconds

        employee_entry = employee_stats[user_id]
        employee_entry["employee_name"] = employee_name
        employee_entry["present_days"] += 1
        employee_entry["worked_seconds"] += worked_seconds
        if is_late:
            employee_entry["late_arrivals"] += 1

    start = datetime.fromisoformat(f"{from_date}T00:00:00")
    end = datetime.fromisoformat(f"{to_date}T00:00:00")
    days = []
    cursor_day = start.date()
    end_day = end.date()

    total_worked_seconds = 0.0
    total_late_arrivals = 0
    total_present_days = 0

    while cursor_day <= end_day:
        key = cursor_day.isoformat()
        entry = daily_stats.get(key, {"users": set(), "late_users": set(), "worked_seconds": 0.0})
        present = len(entry["users"])
        late = len(entry["late_users"])
        absent = max(total_employees - present, 0)
        worked_hours = round(entry["worked_seconds"] / 3600, 2)
        attendance_rate = round((present / total_employees) * 100, 1) if total_employees else 0

        total_worked_seconds += entry["worked_seconds"]
        total_late_arrivals += late
        total_present_days += present

        days.append({
            "date": key,
            "present": present,
            "absent": absent,
            "late": late,
            "worked_hours": worked_hours,
            "attendance_rate": attendance_rate,
        })
        cursor_day += timedelta(days=1)

    employee_rows = []
    for employee in employee_stats.values():
        worked_hours = round(employee["worked_seconds"] / 3600, 2)
        employee_rows.append({
            "employee_name": employee["employee_name"],
            "present_days": employee["present_days"],
            "late_arrivals": employee["late_arrivals"],
            "worked_hours": worked_hours,
        })

    employee_rows.sort(key=lambda row: row["worked_hours"], reverse=True)

    active_employees = len(employee_rows)
    average_work_hours = round((total_worked_seconds / max(active_employees, 1)) / 3600, 2)
    attendance_rate = round((total_present_days / max(len(days) * max(total_employees, 1), 1)) * 100, 1)

    weekly_days = days[-7:] if len(days) > 7 else days

    return {
        "range": {
            "from": from_date,
            "to": to_date,
        },
        "totals": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "late_arrivals": total_late_arrivals,
            "average_work_hours": average_work_hours,
            "attendance_rate": attendance_rate,
            "records": len(records),
        },
        "weekly_trend": weekly_days,
        "monthly_trend": days,
        "top_employees": employee_rows[:5],
    }

def get_user_attendance_summary(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT
            COUNT(*) AS total_records,
            SUM(DATE(login_time) = CURDATE()) AS today_records,
            SUM(logout_time IS NULL) AS currently_present
        FROM attendance
        WHERE user_id = %s
        """,
        (user_id,),
    )
    summary = cur.fetchone()
    cur.close()
    conn.close()
    return summary


def delete_all_attendance_records():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM attendance")
    conn.commit()
    deleted = cur.rowcount
    cur.close()
    conn.close()
    return deleted
