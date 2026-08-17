"""Backend regression tests for Borrowed Blues API."""
import os
import uuid
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE:
    # frontend/.env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE = line.split("=", 1)[1].strip()
BASE = BASE.rstrip("/")

THERAPIST = {"email": "therapist@borrowedblues.com", "password": "TherapistPass123!"}
CLIENT = {"email": "client@borrowedblues.com", "password": "ClientPass123!"}


def _login(session, creds):
    r = session.post(f"{BASE}/api/auth/login", json=creds)
    return r


@pytest.fixture
def anon():
    return requests.Session()


@pytest.fixture
def therapist():
    s = requests.Session()
    r = _login(s, THERAPIST)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture
def client_sess():
    s = requests.Session()
    r = _login(s, CLIENT)
    assert r.status_code == 200, r.text
    return s


# ---------- Public ----------
class TestPublic:
    def test_root(self, anon):
        r = anon.get(f"{BASE}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_therapist_profile(self, anon):
        r = anon.get(f"{BASE}/api/therapist/profile")
        assert r.status_code == 200
        d = r.json()
        assert d.get("name") == "Anushka Prabhu"
        assert d.get("title") == "Counselling Psychologist"
        assert d.get("personal_note")
        assert d.get("approach")
        assert isinstance(d.get("qualifications"), list) and len(d["qualifications"]) >= 3
        assert isinstance(d.get("areas"), list) and "Anxiety" in d["areas"]
        assert isinstance(d.get("pillars"), list) and len(d["pillars"]) == 4

    def test_resources_public(self, anon):
        r = anon.get(f"{BASE}/api/resources/public")
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 6
        # category filter
        r2 = anon.get(f"{BASE}/api/resources/public", params={"category": "Anxiety"})
        assert r2.status_code == 200
        for d in r2.json():
            assert d["category"] == "Anxiety"
        # search
        r3 = anon.get(f"{BASE}/api/resources/public", params={"q": "breathing"})
        assert r3.status_code == 200
        titles = " ".join(d.get("title", "").lower() + " " + d.get("description", "").lower()
                          for d in r3.json())
        assert "breath" in titles


# ---------- Auth ----------
class TestAuth:
    def test_login_therapist(self):
        s = requests.Session()
        r = s.post(f"{BASE}/api/auth/login", json=THERAPIST)
        assert r.status_code == 200
        assert r.json()["role"] == "therapist"
        # cookies set
        assert "access_token" in s.cookies.get_dict() or any(
            c.name == "access_token" for c in s.cookies)
        me = s.get(f"{BASE}/api/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == THERAPIST["email"]

    def test_login_client(self):
        s = requests.Session()
        r = s.post(f"{BASE}/api/auth/login", json=CLIENT)
        assert r.status_code == 200
        assert r.json()["role"] == "client"

    def test_me_without_cookie(self, anon):
        r = anon.get(f"{BASE}/api/auth/me")
        assert r.status_code == 401

    def test_login_wrong_password(self):
        s = requests.Session()
        r = s.post(f"{BASE}/api/auth/login",
                   json={"email": CLIENT["email"], "password": "wrong-pw"})
        assert r.status_code == 401

    def test_bruteforce_lockout(self):
        s = requests.Session()
        bogus_email = f"lock_{uuid.uuid4().hex[:8]}@example.com"
        # register the user with a known password so we can hit the wrong pw path 5 times
        # Use an existing account instead: fresh IP+email pair
        codes = []
        for _ in range(6):
            r = s.post(f"{BASE}/api/auth/login",
                       json={"email": bogus_email, "password": "wrong"})
            codes.append(r.status_code)
        # After 5 wrong attempts a 429 should show up eventually
        assert 429 in codes, f"Expected 429 lockout in {codes}"

    def test_logout(self):
        s = requests.Session()
        s.post(f"{BASE}/api/auth/login", json=CLIENT)
        r = s.post(f"{BASE}/api/auth/logout")
        assert r.status_code == 200
        # cookies cleared
        me = s.get(f"{BASE}/api/auth/me")
        assert me.status_code == 401

    def test_register_and_duplicate(self):
        s = requests.Session()
        email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
        r = s.post(f"{BASE}/api/auth/register",
                   json={"email": email, "password": "TestPass123!", "name": "Test User",
                         "role": "client"})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "client"
        # duplicate
        r2 = requests.post(f"{BASE}/api/auth/register",
                           json={"email": email, "password": "TestPass123!", "name": "X",
                                 "role": "client"})
        assert r2.status_code == 400

    def test_register_ignores_role_escalation(self):
        # A caller supplying role=therapist must not be able to self-elevate;
        # public registration always creates a client account.
        s = requests.Session()
        email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
        r = s.post(f"{BASE}/api/auth/register",
                   json={"email": email, "password": "TestPass123!", "name": "Escalator",
                         "role": "therapist"})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "client"
        me = s.get(f"{BASE}/api/auth/me")
        assert me.json()["role"] == "client"

    def test_consultation_request_public_then_visible_to_therapist(self, anon, therapist):
        unique = f"TEST_{uuid.uuid4().hex[:8]}"
        payload = {"name": f"{unique} Person", "email": f"{unique}@example.com",
                   "reason": "TEST reason", "preferred_time": "evenings"}
        r = anon.post(f"{BASE}/api/consultation-requests", json=payload)
        assert r.status_code == 200, r.text
        created_id = r.json()["id"]
        reqs = therapist.get(f"{BASE}/api/therapist/requests").json()
        assert any(x["id"] == created_id for x in reqs), "Consultation request not visible to therapist"

    def test_forgot_password_no_leak(self, anon):
        r1 = anon.post(f"{BASE}/api/auth/forgot-password",
                       json={"email": "nobody-nowhere@example.com"})
        r2 = anon.post(f"{BASE}/api/auth/forgot-password",
                       json={"email": CLIENT["email"]})
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json().get("ok") is True and r2.json().get("ok") is True


# ---------- Role guards ----------
class TestRoleGuards:
    def test_client_cannot_access_therapist(self, client_sess):
        endpoints = [
            ("GET", "/api/therapist/dashboard"),
            ("GET", "/api/therapist/clients"),
            ("GET", "/api/therapist/appointments"),
            ("GET", "/api/therapist/requests"),
            ("GET", "/api/therapist/reflections"),
            ("GET", "/api/therapist/session-notes"),
            ("POST", "/api/therapist/session-notes"),
            ("POST", "/api/therapist/homework"),
            ("POST", "/api/therapist/resources"),
            ("POST", "/api/therapist/appointments"),
        ]
        for method, ep in endpoints:
            r = client_sess.request(method, f"{BASE}{ep}", json={})
            assert r.status_code == 403, f"{method} {ep} -> {r.status_code}"

    def test_therapist_cannot_access_client(self, therapist):
        endpoints = [
            ("GET", "/api/client/dashboard"),
            ("GET", "/api/client/appointments"),
            ("GET", "/api/client/reflections"),
            ("GET", "/api/client/homework"),
            ("GET", "/api/client/session-notes"),
            ("GET", "/api/client/resources"),
        ]
        for method, ep in endpoints:
            r = therapist.request(method, f"{BASE}{ep}")
            assert r.status_code == 403, f"{ep} -> {r.status_code}"


# ---------- Therapist flow ----------
class TestTherapist:
    def test_dashboard(self, therapist):
        r = therapist.get(f"{BASE}/api/therapist/dashboard")
        assert r.status_code == 200
        d = r.json()
        for key in ("today", "upcoming", "requests", "reflections", "client_count"):
            assert key in d
        assert d["client_count"] >= 1

    def test_create_appointment_and_visible_in_dashboard(self, therapist):
        clients = therapist.get(f"{BASE}/api/therapist/clients").json()
        seeded = next((c for c in clients if c["email"] == CLIENT["email"]), None)
        assert seeded
        from datetime import date, timedelta
        future = (date.today() + timedelta(days=5)).isoformat()
        r = therapist.post(f"{BASE}/api/therapist/appointments", json={
            "client_id": seeded["id"], "date": future, "time": "11:00",
            "duration_min": 50, "mode": "online", "notes": "TEST_appt"
        })
        assert r.status_code == 200, r.text
        appt_id = r.json()["id"]
        # visible in dashboard upcoming
        dash = therapist.get(f"{BASE}/api/therapist/dashboard").json()
        assert any(a["id"] == appt_id for a in dash["upcoming"])

        # patch to cancelled
        pr = therapist.patch(f"{BASE}/api/therapist/appointments/{appt_id}",
                             json={"status": "cancelled"})
        assert pr.status_code == 200
        assert pr.json()["status"] == "cancelled"

    def test_session_note_and_homework(self, therapist):
        clients = therapist.get(f"{BASE}/api/therapist/clients").json()
        seeded = next(c for c in clients if c["email"] == CLIENT["email"])
        r = therapist.post(f"{BASE}/api/therapist/session-notes", json={
            "client_id": seeded["id"],
            "summary": "TEST_summary",
            "homework": "reflect",
            "shared_with_client": True,
        })
        assert r.status_code == 200
        assert r.json()["summary"] == "TEST_summary"

        h = therapist.post(f"{BASE}/api/therapist/homework", json={
            "client_id": seeded["id"], "title": "TEST_hw",
            "description": "desc", "type": "writing",
        })
        assert h.status_code == 200

    def test_requests_patch(self, therapist):
        reqs = therapist.get(f"{BASE}/api/therapist/requests").json()
        if not reqs:
            pytest.skip("no seeded requests")
        rid = reqs[0]["id"]
        r = therapist.patch(f"{BASE}/api/therapist/requests/{rid}",
                            json={"status": "accepted"})
        assert r.status_code == 200


# ---------- Client flow ----------
class TestClient:
    def test_dashboard(self, client_sess):
        r = client_sess.get(f"{BASE}/api/client/dashboard")
        assert r.status_code == 200
        d = r.json()
        for k in ("upcoming", "latest_summary", "homework", "reflections"):
            assert k in d

    def test_request_appointment(self, client_sess):
        from datetime import date, timedelta
        future = (date.today() + timedelta(days=8)).isoformat()
        r = client_sess.post(f"{BASE}/api/client/appointments/request", json={
            "date": future, "time": "15:00", "duration_min": 50, "mode": "online",
            "notes": "TEST_client_req"
        })
        assert r.status_code == 200
        assert r.json()["status"] == "requested"

    def test_create_reflection(self, client_sess):
        r = client_sess.post(f"{BASE}/api/client/reflections", json={
            "title": "TEST_reflection", "body": "a small noticing", "is_draft": False,
        })
        assert r.status_code == 200
        listing = client_sess.get(f"{BASE}/api/client/reflections").json()
        assert any(x["title"] == "TEST_reflection" for x in listing)

    def test_toggle_homework(self, client_sess):
        hws = client_sess.get(f"{BASE}/api/client/homework").json()
        assert hws, "expected seeded homework"
        hid = hws[0]["id"]
        r = client_sess.patch(f"{BASE}/api/client/homework/{hid}",
                              json={"completed": True, "completed_items": [0]})
        assert r.status_code == 200
        assert r.json()["completed"] is True
        # revert
        client_sess.patch(f"{BASE}/api/client/homework/{hid}",
                          json={"completed": False, "completed_items": []})
