# TEST PLAN

## 6.1 Authentication Tests
- User can sign up with email and password
- User can log in with correct credentials
- Invalid credentials show error message
- Logged-out users cannot access dashboard
- Role-based access: Hospital sees only hospital pages
- Role-based access: Blood bank sees only blood bank pages

## 6.2 Emergency Request Tests
- Hospital can create emergency request
- All required fields are validated
- Request is saved to database
- Matching engine triggers immediately
- Hospital receives list of matches with scores
- Hospital can cancel request

## 6.3 Matching Algorithm Tests
- Filter by correct component type
- Filter by blood group compatibility
- Filter by sufficient quantity
- Filter by distance radius
- Sort by priority score (0-100)
- Nearest resource appears first
- Highest availability scored first
- CRITICAL urgency receives highest score

## 6.4 Blood Bank Response Tests
- Blood bank can see incoming emergency request
- Blood bank can accept full quantity
- Blood bank can offer partial units
- Blood bank can reject request
- Inventory updates after acceptance
- Hospital dashboard updates in real-time

## 6.5 Responsive Design Tests
- Test at 375px (mobile)
- Test at 768px (tablet)
- Test at 1440px (desktop)
- All buttons clickable on mobile
- Forms easily fillable on mobile
- No horizontal scrolling

## 6.6 Performance Tests
- Emergency request creation: <2 seconds
- Matching returns results: <5 seconds
- Dashboard loads: <3 seconds
- System handles 5+ simultaneous requests

## 6.7 Audit Log Tests
- Every action is logged in audit_logs
- Request status transitions are recorded
- Blood bank responses are logged
- Inventory changes are audited
- Complete timeline visible in request details
