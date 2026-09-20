# 24-HOUR DEVELOPMENT PLAN & TASKS

## 5.1 Team Assignment (3-4 members)
- **Member 1 (Frontend)**: React UI, forms, dashboards, responsive design
- **Member 2 (Backend)**: Supabase, database, auth, RLS
- **Member 3 (Algorithm)**: Matching engine, distance, prioritization
- **Member 4 (Integration)**: Notifications, realtime, testing, deployment

## 5.2 Hours 0-1: Team Setup
- Assign roles and responsibilities
- Create GitHub repository
- Initialize Vite + React project
- Create documentation structure
- Set up `.env.example` and `.gitignore`

## 5.3 Hours 1-3: Database & Auth
- Create Supabase project
- Design and create all 10 database tables
- Set up authentication roles
- Implement Row Level Security
- Create seed data for testing
- Test Supabase connection from frontend

## 5.4 Hours 3-6: Hospital Interface
- Create login/signup pages
- Build hospital dashboard with cards
- Create emergency request form
- Test form submission and database save
- Show submission confirmation

## 5.5 Hours 6-9: Blood Bank Interface
- Build blood bank dashboard
- Create inventory management interface
- Build emergency request list
- Create accept/reject/partial response workflow
- Update inventory after acceptance

## 5.6 Hours 9-12: Matching Engine
- Implement blood group/component filter
- Implement quantity validation
- Implement distance calculation (Haversine formula)
- Implement prioritization formula: **40% availability + 30% distance + 20% urgency + 10% freshness**
- Create matches in database
- TEST: All matching logic thoroughly

## 5.7 Hours 12-14: Realtime Updates
- Set up Supabase Realtime
- Connect request → matching → notification flow
- Update hospital dashboard when matches found
- Update blood bank inventory when units reserved
- Test complete workflow end-to-end

## 5.8 Hours 14-16: Donor Module
- Create donor registration form
- Build donor dashboard
- Show nearby compatible emergencies
- Implement donor response
- Do NOT build medical eligibility logic

## 5.9 Hours 16-18: Tracking & Audit
- Create request timeline visualization
- Show status changes: Created → Matching → Notified → Response → Reserved → Fulfilled
- Populate `audit_logs` on every action
- Build audit log viewer for admin
- TEST: Verify all state transitions

## 5.10 Hours 18-20: UI Polish
- Improve colors and cards (follow DESIGN.md)
- Add icons (Lucide React)
- Fix responsive design
- Add loading states on all operations
- Add error messages and retry logic
- Test accessibility

## 5.11 Hours 20-21: Demo Data
- Create 5 blood banks with locations
- Create 10 donors with blood groups
- Create varying inventory levels
- Create 3 emergency requests
- Do NOT depend on real data during demo

## 5.12 Hours 21-22: Testing
- Scenario 1: O+ request → matches → nearest appears
- Scenario 2: Inventory changes → dashboard updates
- Scenario 3: Blood bank rejects → system moves to next
- Scenario 4: Critical request → high priority → rapid notification
- Test mobile at 375px
- Test slow network (3G throttle)

## 5.13 Hours 22-23: Presentation Prep
- Create 7-8 slide presentation
  - Slide 1: Problem statement
  - Slide 2: Existing gaps (e-RaktKosh limitations)
  - Slide 3: Our solution approach
  - Slide 4: System architecture
  - Slide 5: Matching algorithm
  - Slide 6: Key innovation
  - Slide 7: Demo workflow
  - Slide 8: Impact & scalability

## 5.14 Hours 23-24: Deployment & Final
- STOP adding features
- Final git commit and push
- Deploy to Vercel (production)
- Test production URL
- Create backup of local version
- Record 3-minute demo video
- Prepare presentation file
