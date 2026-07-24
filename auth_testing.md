# Borrowed Blues — Auth Testing

Seeded accounts (from `/app/backend/.env`):
- Therapist: `therapist@borrowedblues.com` / `TherapistPass123!`
- Client:    `client@borrowedblues.com`    / `ClientPass123!`

## MongoDB verification
```
mongosh
use borrowed_blues
db.users.find({}, {password_hash:1, email:1, role:1}).pretty()
```
- `password_hash` must start with `$2b$`.
- Unique index must exist on `users.email`.

## API smoke test
```
BASE=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)

curl -c /tmp/c.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"therapist@borrowedblues.com","password":"TherapistPass123!"}'

curl -b /tmp/c.txt "$BASE/api/auth/me"
curl -b /tmp/c.txt "$BASE/api/therapist/dashboard"
```

Login should return `{ id, email, name, role: "therapist", ...}` and set both
`access_token` and `refresh_token` cookies.
