from backend.app.database.db_connection import get_db_connection


def ensure_camera_source_tables():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS camera_sources (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            source_type ENUM('usb', 'rtsp', 'http') NOT NULL DEFAULT 'usb',
            source_value VARCHAR(500) NOT NULL,
            username VARCHAR(100) NULL,
            password_ref VARCHAR(255) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 0,
            is_enabled TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS camera_recordings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            camera_source_id INT NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            started_at DATETIME NOT NULL,
            ended_at DATETIME NULL,
            duration_seconds INT NULL,
            file_size_bytes BIGINT NULL,
            recording_status ENUM('recording', 'completed', 'failed') NOT NULL DEFAULT 'recording',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (camera_source_id) REFERENCES camera_sources(id) ON DELETE CASCADE
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS camera_health_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            camera_source_id INT NULL,
            status ENUM('ok', 'warning', 'error') NOT NULL,
            message VARCHAR(500) NOT NULL,
            checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (camera_source_id) REFERENCES camera_sources(id) ON DELETE SET NULL
        )
        """
    )

    conn.commit()
    cur.close()
    conn.close()


def list_camera_sources():
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, source_type, source_value, username, password_ref, is_active, is_enabled, created_at, updated_at
        FROM camera_sources
        ORDER BY is_active DESC, id DESC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def create_camera_source(name, source_type, source_value, username=None, password_ref=None, is_enabled=True):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO camera_sources (name, source_type, source_value, username, password_ref, is_enabled)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (name, source_type, source_value, username, password_ref, 1 if is_enabled else 0),
    )
    conn.commit()
    source_id = cur.lastrowid
    cur.close()
    conn.close()
    return source_id


def update_camera_source(source_id, name, source_type, source_value, username=None, password_ref=None, is_enabled=True):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE camera_sources
        SET name = %s,
            source_type = %s,
            source_value = %s,
            username = %s,
            password_ref = %s,
            is_enabled = %s
        WHERE id = %s
        """,
        (name, source_type, source_value, username, password_ref, 1 if is_enabled else 0, source_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    cur.close()
    conn.close()
    return updated


def get_camera_source_by_id(source_id):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, source_type, source_value, username, password_ref, is_active, is_enabled, created_at, updated_at
        FROM camera_sources
        WHERE id = %s
        """,
        (source_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def set_active_camera_source(source_id):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE camera_sources SET is_active = 0")
    cur.execute(
        """
        UPDATE camera_sources
        SET is_active = 1
        WHERE id = %s AND is_enabled = 1
        """,
        (source_id,),
    )
    conn.commit()
    activated = cur.rowcount > 0
    cur.close()
    conn.close()
    return activated


def get_active_camera_source():
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, source_type, source_value, username, password_ref, is_active, is_enabled
        FROM camera_sources
        WHERE is_active = 1 AND is_enabled = 1
        ORDER BY id DESC
        LIMIT 1
        """
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def list_enabled_camera_sources():
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT id, name, source_type, source_value, username, password_ref, is_active, is_enabled
        FROM camera_sources
        WHERE is_enabled = 1
        ORDER BY is_active DESC, id DESC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def add_camera_health_log(camera_source_id, status, message):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO camera_health_logs (camera_source_id, status, message)
        VALUES (%s, %s, %s)
        """,
        (camera_source_id, status, message),
    )
    conn.commit()
    cur.close()
    conn.close()


def list_camera_health_logs(limit=20):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT l.id, l.camera_source_id, s.name AS source_name, l.status, l.message, l.checked_at
        FROM camera_health_logs l
        LEFT JOIN camera_sources s ON s.id = l.camera_source_id
        ORDER BY l.checked_at DESC
        LIMIT %s
        """,
        (int(limit),),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def create_camera_recording(camera_source_id, file_path, started_at):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO camera_recordings (camera_source_id, file_path, started_at, recording_status)
        VALUES (%s, %s, %s, 'recording')
        """,
        (camera_source_id, file_path, started_at),
    )
    conn.commit()
    rec_id = cur.lastrowid
    cur.close()
    conn.close()
    return rec_id


def complete_camera_recording(recording_id, ended_at, duration_seconds, file_size_bytes, status="completed"):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE camera_recordings
        SET ended_at = %s,
            duration_seconds = %s,
            file_size_bytes = %s,
            recording_status = %s
        WHERE id = %s
        """,
        (ended_at, duration_seconds, file_size_bytes, status, recording_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    cur.close()
    conn.close()
    return updated


def list_camera_recordings(limit=50):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT r.id, r.camera_source_id, s.name AS source_name, r.file_path, r.started_at, r.ended_at,
               r.duration_seconds, r.file_size_bytes, r.recording_status
        FROM camera_recordings r
        LEFT JOIN camera_sources s ON s.id = r.camera_source_id
        ORDER BY r.started_at DESC
        LIMIT %s
        """,
        (int(limit),),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def delete_camera_source(source_id):
    ensure_camera_source_tables()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM camera_sources WHERE id = %s", (source_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    cur.close()
    conn.close()
    return deleted
