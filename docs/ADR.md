# ARCHITECTURE DECISION RECORDS (ADR)

## 8.1 ADR-001: Choose Supabase
- **Decision**: Use Supabase (PostgreSQL + Auth + Realtime + APIs) as backend.
- **Reason**: Provides production-grade database, authentication, and realtime without managing separate backend. Reduces dev time in 24-hour hackathon. Team has prior Supabase experience.

## 8.2 ADR-002: Rule-Based Matching, Not AI
- **Decision**: Implement matching using deterministic scoring rules (40% availability + 30% distance + 20% urgency + 10% freshness), not machine learning.
- **Reason**: Rule-based matching is interpretable, fast, and doesn't require training data. AI/ML adds complexity without clear benefit. Judges can understand the logic.

## 8.3 ADR-003: Minimal Patient Data
- **Decision**: Store only blood group for patients. Do not store medical history or clinical details.
- **Reason**: Reduces privacy risk. Aligns with WHO guidance that final compatibility testing is blood bank responsibility.

## 8.4 ADR-004: Differentiation from e-RaktKosh
- **Decision**: Position system as emergency coordination layer on top of existing blood availability systems.
- **Reason**: e-RaktKosh handles inventory search. Our innovation is rapid matching, prioritization, and auditable fulfillment workflow.

## 8.5 ADR-005: Haversine Formula for Distance
- **Decision**: Use mathematical Haversine formula instead of API calls.
- **Reason**: Faster, no API quota issues, deterministic. Sufficient accuracy for demo.

## 8.6 ADR-006: Realtime Instead of Polling
- **Decision**: Use Supabase Realtime for live updates.
- **Reason**: Eliminates latency. Hospital sees inventory changes immediately. More impressive demo.

## 8.7 ADR-007: Audit Logs as First-Class Feature
- **Decision**: Log every state change in `audit_logs` table. Make audit trail visible in UI.
- **Reason**: PS-02 explicitly requires request traceability. Satisfies evaluation criteria.

## 8.8 ADR-008: No Mobile App for MVP
- **Decision**: Build mobile-responsive web (PWA) instead of native mobile app.
- **Reason**: Responsive web covers all devices. Native adds 4-6 hours per platform.
