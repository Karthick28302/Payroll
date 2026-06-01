import pytest


@pytest.fixture()
def client(monkeypatch):
    # Keep config validation satisfied for test startup.
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("DB_PASSWORD", "test-password")

    from backend.main import create_app

    app = create_app()
    app.config.update(TESTING=True)

    with app.test_client() as test_client:
        yield test_client
