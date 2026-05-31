import pytest
from pathlib import Path
import sys
from fastapi.testclient import TestClient

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.main import app
from src.models import metadata
from src.database import engine


@pytest.fixture(scope="session")
def client():
    metadata.create_all(engine)
    with TestClient(app) as c:
        yield c
