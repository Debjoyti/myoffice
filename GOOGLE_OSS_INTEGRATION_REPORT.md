# Google Open Source Integration Report

This document outlines the architectural enhancements and integrations made to the SaaS ERP & HRMS platform using the Google Open Source ecosystem.

## 1. Operations & Scheduling (Google OR-Tools)
- **Problem**: Advanced HR scheduling and shift assignment was previously missing or relied on manual configuration.
- **Solution**: We integrated `ortools` into the backend. A new endpoint `/api/scheduling/schedule` uses the `CpSolver` to calculate optimal shift configurations for employees while respecting constraints (e.g. at most one shift per day).
- **Code Impact**: `backend/api/scheduling.py` added and registered in `backend/main.py`.

## 2. AI & Frontend Security (TensorFlow.js & MediaPipe/BlazeFace)
- **Problem**: The AI Proctored Interview system lacked real-time environmental verification, creating cheating vulnerabilities.
- **Solution**: We introduced `@tensorflow/tfjs` and `@tensorflow-models/blazeface` directly into the React frontend. The browser now accesses the webcam to perform real-time ML inference. If multiple faces or no faces are detected, it updates the visual state to alert the proctor engine.
- **Code Impact**: `frontend/src/pages/Careers.js` fully overhauled with `useRef` based canvas rendering and TFJS integration.

## 3. Infrastructure & Security (Kubernetes & Distroless)
- **Problem**: Deployments lacked high availability configuration, and standard Docker images introduced unnecessary attack vectors.
- **Solution**: We created robust `Dockerfile.backend` and `Dockerfile.frontend` leveraging Google's `distroless` images (e.g. `gcr.io/distroless/python3-debian12`). We also added Kubernetes manifests (`Deployment` and `Service`) in the `k8s/` folder for enterprise-grade scalability.
- **Code Impact**: `Dockerfile.backend`, `Dockerfile.frontend`, and `k8s/` manifests generated.

## 4. DevX Tooling (Google `zx`)
- **Problem**: Shell scripts for building and deploying can be brittle and hard to maintain across teams.
- **Solution**: We integrated Google's `zx` to write deployment scripts in JavaScript, bridging the gap between robust shell execution and node semantics.
- **Code Impact**: `scripts/deploy.mjs` orchestrates Docker builds and Kubernetes deployments.

## Future Recommendations
- **Bazel**: For monorepo polyglot builds as the application scales.
- **gRPC**: For ultra-fast microservice communication replacing standard REST where performance is critical.
