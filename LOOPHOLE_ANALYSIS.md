# AI Attendance System - Loophole Analysis & Security Design

## 1. System Architecture
- **Frontend (React)**: Handles webcam interface using `face-api.js` (simulated for immediate production speed but extensible). A global `useActivityMonitor` hook captures `mousemove`, `keydown`, `scroll`, and `click` to calculate precise user idle times.
- **Backend (FastAPI)**: Serves endpoints to start sessions, ingest continuous heartbeats, and end sessions.
- **Database (MongoDB/Supabase)**: Logs granular points of truth: `FaceVerifications`, `DeviceLogs`, `IpLogs`, `ActivityLogs`, `AnomalyFlags`, and continuous `AttendanceSessions`.

## 2. DB Schema (Implemented via Pydantic)
- `FaceVerification`: Tracks status, `confidence_score`, and `liveness_passed`.
- `DeviceLog`: Captures `user_agent` and `device_fingerprint`.
- `IpLog`: Stores `ip_address` and `is_vpn_proxy` boolean.
- `ActivityLog`: Links to session, captures `idle_time_seconds`.
- `AnomalyFlag`: Records the reason (`face_mismatch`, `ip_change`, `long_idle`) and a calculated severity (`low`, `medium`, `high`).
- `AttendanceSession`: Consolidates tracking to a `trust_score` (0-100) and `status` (`active`, `ended`, `suspicious`).

## 3. AI Logic (Face + Behavior)
- **Face Verification**: Triggered explicitly on Login and Logout. (Real-world liveness prevents deep fakes/photos by demanding blink/movement).
- **Behavior (Continuous Tracking)**: Background worker (every 60 seconds) queries idle times from the activity monitor and the current IP. If an employee leaves their desk (e.g. idle > 10 min), trust score degrades.
- **Trust Scoring Engine**:
  - Baseline: 100%.
  - `ip_change`: -20%.
  - `long_idle` (>10 min): -5%.
  - Status transitions to `suspicious` if score drops below 50%.

## 4. Edge Case Handling
- **User Disconnects / Closes Browser**: Heartbeats stop arriving. The system will consider the session abandoned/ended if `last_heartbeat` is drastically old during a periodic cron check (to be added in DB crons).
- **Camera Disabled Mid-Session**: If random face checks are enforced (future enhancement), failure to capture drops trust score to 0.
- **VPN / Proxy usage**: Detected via backend network IP resolution and flagged.

## 5. Loophole Analysis
### Identified Bypasses & Resolutions
1. **The "Photo Spoof" (Show & Leave)**
   - *Bypass*: Show a static image of the employee.
   - *Fix*: Implementation requires liveness detection (blink/smile) in `face-api.js`. Additionally, continuous behavioral monitoring ensures they can't just spoof at login and walk away.
2. **The "Auto-Clicker" (Fake Activity)**
   - *Bypass*: Employee runs a macro to move the mouse every 5 minutes.
   - *Fix*: Advanced implementations should capture variance in keystrokes and random face-check prompts during active sessions.
3. **The "IP Spoofing / VPN"**
   - *Bypass*: Working from an unapproved location via VPN.
   - *Fix*: IP changes mid-session flag as "High Severity", instantly degrading trust score.
4. **The "Disable JS / Network Drop"**
   - *Bypass*: Employee disconnects from wifi to stop tracking.
   - *Fix*: The lack of heartbeats forces the session state to stale/ended. No attendance credit is given for times without heartbeats.

## 6. Security & Privacy
- **Consent**: System must prompt "Camera Access Required" and document HR policies.
- **Data Retention**: We do not store raw video feeds, only encoded Face Descriptors (vectors) and the metadata log of verifications. This vastly reduces compliance risk (GDPR/CCPA).
- **Encryption**: Data transmitted over HTTPS, with sensitive biometric descriptors stored securely in the database.
