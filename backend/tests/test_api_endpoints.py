import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_eta_station_endpoint():
    res = client.get("/eta/station/NDLS")
    assert res.status_code == 200
    data = res.json()
    assert data["station_code"] == "NDLS"
    assert len(data["trains"]) > 0


def test_eta_train_endpoint():
    res = client.get("/eta/train/12951")
    assert res.status_code == 200
    data = res.json()
    assert data["train_no"] == "12951"
    assert "explainability_text" in data
    assert len(data["stops"]) > 0


def test_booking_search_and_book():
    # 1. Search
    search_res = client.get("/booking/search?from=NDLS&to=MMCT&class=3A")
    assert search_res.status_code == 200
    trains = search_res.json()
    assert len(trains) > 0

    # 2. Book
    book_payload = {
        "train_no": "12951",
        "from_station": "NDLS",
        "to_station": "MMCT",
        "travel_class": "3A",
        "quota": "GN",
        "journey_date": "2026-09-05",
        "passenger_name": "Test Passenger",
        "passenger_age": 29,
        "passenger_gender": "M",
        "berth_preference": "Lower"
    }
    book_res = client.post("/booking/book", json=book_payload)
    assert book_res.status_code == 200
    pnr_data = book_res.json()
    assert len(pnr_data["id"]) == 10
    assert pnr_data["status"] == "CNF"

    # 3. Retrieve PNR
    pnr_get = client.get(f"/booking/pnr/{pnr_data['id']}")
    assert pnr_get.status_code == 200
    assert pnr_get.json()["passenger_name"] == "Test Passenger"


def test_complaints_and_sos():
    # 1. SOS
    sos_res = client.post("/complaints/sos", json={
        "pnr_id": "8421950341",
        "coach": "B2",
        "berth": 45,
        "emergency_type": "Medical Emergency",
        "description": "Passenger needing immediate first aid"
    })
    assert sos_res.status_code == 200
    assert sos_res.json()["priority"] == "emergency"

    # 2. Cleaning
    clean_res = client.post("/complaints/cleaning", json={
        "pnr_id": "8421950341",
        "coach": "B2",
        "berth": 45,
        "cleaning_type": "Coach Floor",
        "description": "Sanitization request"
    })
    assert clean_res.status_code == 200
    assert clean_res.json()["type"] == "cleaning"

    # 3. Seat Swap
    swap_res = client.post("/complaints/swap/request", json={
        "requester_pnr_id": "8421950341",
        "preferred_berth_type": "Lower",
        "reason": "Senior citizen mobility issue"
    })
    assert swap_res.status_code == 200
    assert "swap_id" in swap_res.json()


def test_chatbot_intent_dispatch():
    # ETA inquiry
    eta_chat = client.post("/chat/message", json={
        "text": "Where is train 12951 right now?"
    })
    assert eta_chat.status_code == 200
    assert "Mumbai Rajdhani" in eta_chat.json()["reply_text"]
    assert eta_chat.json()["action_type"] == "eta_card"

    # PNR inquiry
    pnr_chat = client.post("/chat/message", json={
        "text": "Check status for PNR 8421950341"
    })
    assert pnr_chat.status_code == 200
    assert "CONFIRMED" in pnr_chat.json()["reply_text"]


def test_notifications_and_profile():
    notifs = client.get("/notifications")
    assert notifs.status_code == 200
    assert len(notifs.json()) > 0

    profile = client.get("/profile")
    assert profile.status_code == 200
    assert "user" in profile.json()
