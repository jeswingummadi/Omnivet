import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.triage import evaluate_triage

client = TestClient(app)

def test_triage_engine_high_risk_blisters():
    status, triggers = evaluate_triage('["blisters", "salivation"]')
    assert status == "flagged_high_risk"
    assert "blisters" in triggers

def test_triage_engine_high_risk_fever():
    status, triggers = evaluate_triage("Animal is suffering from high fever and weakness")
    assert status == "flagged_high_risk"
    assert "high fever" in triggers

def test_triage_engine_high_risk_sudden_death():
    status, triggers = evaluate_triage("found dead in pen", mortality_status=True)
    assert status == "flagged_high_risk"

def test_triage_engine_pending_mild():
    status, triggers = evaluate_triage("mild cough")
    assert status == "pending"
    assert len(triggers) == 0

def test_create_report_and_triage():
    payload = {
        "species": "Cattle",
        "farmer_name": "Test Farmer",
        "farmer_phone": "+1-000-111-2222",
        "symptoms": ["blisters", "salivation"],
        "mortality_status": False,
        "latitude": -1.2850,
        "longitude": 36.8200
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "flagged_high_risk"
    assert data["latitude"] == -1.2850
    assert data["longitude"] == 36.8200

def test_get_outbreaks_endpoint():
    response = client.get("/api/outbreaks")
    assert response.status_code == 200
    outbreaks = response.json()
    assert isinstance(outbreaks, list)
    assert len(outbreaks) > 0
    # verify coordinates and high risk status
    for item in outbreaks:
        assert "latitude" in item
        assert "longitude" in item
        assert item["status"] in ["flagged", "flagged_high_risk", "escalated_quarantine_alert"]

def test_escalate_report():
    # First create a report
    payload = {
        "species": "Goat",
        "farmer_name": "Alert Farmer",
        "farmer_phone": "+1-999-888-7777",
        "symptoms": ["high fever"],
        "mortality_status": False,
        "latitude": -1.2900,
        "longitude": 36.8100
    }
    create_res = client.post("/api/reports", json=payload)
    report_id = create_res.json()["id"]

    # Escalate
    esc_res = client.post(f"/api/reports/{report_id}/escalate")
    assert esc_res.status_code == 200
    assert esc_res.json()["status"] == "escalated_quarantine_alert"
