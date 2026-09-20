# SECURITY REQUIREMENTS

## 7.1 Authentication Security
- Use Supabase Auth (production-grade)
- All routes require authentication
- Token stored securely (httpOnly cookies / Secure storage)
- Password hashed by Supabase
- Session expires after 24 hours

## 7.2 Authorization Security
- Role-based access control: Hospital, Blood Bank, Donor, Admin
- Hospital sees only own requests and responses
- Blood bank sees only relevant requests
- Donor sees only compatible emergencies
- Admin can view all data
- Row Level Security (RLS) enforces at database level

## 7.3 Data Protection
- HTTPS only (enforced by Vercel)
- No patient medical records stored
- Only blood group required
- Audit logs store all changes
- Database backups configured in Supabase

## 7.4 Input Validation
- Server-side validation on all form submissions
- Blood group values from predefined list only
- Component type from predefined list only
- Quantity must be positive integer
- Prevent SQL injection via parameterized queries
- Prevent XSS by sanitizing output

## 7.5 Secrets Management
- Use `.env.local` for development secrets
- `.env.example` shows structure without values
- Supabase keys stored in Vercel environment variables
- Never commit `.env.local` to Git
- Rotate keys periodically
