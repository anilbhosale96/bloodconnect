# ARCHITECTURE DOCUMENT

## 2.1 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + Vite |
| **UI Framework** | Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + APIs) |
| **Authentication** | Supabase Auth with RBAC |
| **Realtime Updates** | Supabase Realtime |
| **Maps** | Google Maps / Mapbox API / Leaflet |
| **Distance Calculation** | Haversine Formula |
| **Charts** | Recharts |
| **Deployment** | Vercel |
| **Version Control** | GitHub |

## 2.2 System Architecture
```
Frontend (React + Vite) 
   → HTTPS/API 
   → Supabase Auth 
   → [Emergency Request Service | Matching Engine | Notification Service] 
   → PostgreSQL
```

## 2.3 Database Tables
1. **profiles**: User authentication and role assignment (`hospital`, `blood_bank`, `donor`, `admin`)
2. **hospitals**: Hospital registration, location, verification
3. **blood_banks**: Blood bank details, inventory, status
4. **inventory**: Blood components, quantities, expiry
5. **donors**: Donor profiles, blood group, availability
6. **emergency_requests**: Request details, urgency, deadline
7. **matches**: Matched resources with priority scores
8. **responses**: Responder acceptance/rejection
9. **notifications**: In-app notification history
10. **audit_logs**: Complete request history and actions

## 2.4 Security Approach
- Supabase Auth with role-based access control (RBAC)
- Row Level Security (RLS) on all sensitive tables
- Hospital sees only own requests and matching responses
- Blood bank sees only relevant emergency requests
- Donor sees only compatible nearby emergencies
- Admin can verify and monitor all entities
- All database transactions logged in `audit_logs`
- No patient medical details stored beyond blood group
