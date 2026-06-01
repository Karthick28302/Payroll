from backend.app.database.db_connection import get_db_connection
from backend.app.config import get_db_config


def ensure_user_compensation_columns():
    """Ensure compensation columns exist in users table."""
    db_config = get_db_config()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name = 'users'
          AND column_name IN ('monthly_salary', 'pf_percent', 'savings_percent')
        """,
        (db_config["database"],),
    )
    existing = {row[0] for row in cur.fetchall()}

    if "monthly_salary" not in existing:
        cur.execute(
            """
            ALTER TABLE users
            ADD COLUMN monthly_salary DECIMAL(12, 2) NOT NULL DEFAULT 0
            """
        )
    if "pf_percent" not in existing:
        cur.execute(
            """
            ALTER TABLE users
            ADD COLUMN pf_percent DECIMAL(5, 2) NOT NULL DEFAULT 12
            """
        )
    if "savings_percent" not in existing:
        cur.execute(
            """
            ALTER TABLE users
            ADD COLUMN savings_percent DECIMAL(5, 2) NOT NULL DEFAULT 10
            """
        )

    conn.commit()
    cur.close()
    conn.close()


def get_user_by_name(name: str):
    """Return user row by lowercase trimmed name, or None."""
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE LOWER(TRIM(name)) = %s", (name.strip().lower(),))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result


def get_admin_by_username(username: str):
    """Return admin row by username, or None."""
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM admins WHERE username = %s", (username,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result


def create_user(name: str):
    """Insert a new user. Raises exception if name already exists."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (name) VALUES (%s)", (name.strip().lower(),))
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    conn.close()
    return new_id


def user_exists(name: str) -> bool:
    """Return True if a user with this name already exists."""
    return get_user_by_name(name) is not None


def get_all_users():
    """Return list of all registered users."""
    ensure_user_compensation_columns()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, created_at, monthly_salary, pf_percent, savings_percent
        FROM users
        ORDER BY name
        """
    )
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results

def get_user_by_id(user_id: int):
    ensure_user_compensation_columns()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, created_at, monthly_salary, pf_percent, savings_percent
        FROM users
        WHERE id = %s
        """,
        (user_id,),
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def update_user_compensation(
    user_id: int,
    monthly_salary: float,
    pf_percent: float,
    savings_percent: float,
):
    ensure_user_compensation_columns()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE users
        SET monthly_salary = %s,
            pf_percent = %s,
            savings_percent = %s
        WHERE id = %s
        """,
        (monthly_salary, pf_percent, savings_percent, user_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    cur.close()
    conn.close()
    return updated


def delete_user_by_id(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    # Delete dependent attendance rows first to support older schemas
    # where FK may not be ON DELETE CASCADE.
    cur.execute("DELETE FROM attendance WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    cur.close()
    conn.close()
    return deleted
