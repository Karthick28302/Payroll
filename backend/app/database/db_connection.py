import mysql.connector
from backend.app.config import get_db_config

def get_db_connection():
    db_config = get_db_config()
    connection = mysql.connector.connect(
        host=db_config["host"],
        user=db_config["user"],
        password=db_config["password"],
        database=db_config["database"]
    )
    return connection
