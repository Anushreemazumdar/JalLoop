# JalLoop — Civic Water Resilience Platform

**Connecting water incidents, recovery planning, and community resilience in one platform.**

JalLoop is a civic water-resilience platform designed to help communities and local authorities organize waterlogging incidents, track water shortages, analyze potential rainwater recovery, and monitor recovery projects through a transparent, human-reviewed workflow.

Rather than treating every water-related problem as an isolated report, JalLoop connects incident records, spatial recurrence signals, hydrological estimates, and recovery verification to support better-informed decisions.

## The Problem

Urban areas face interconnected water challenges:

- **Waterlogging:** Heavy rainfall can flood roads, disrupt transportation, and damage public spaces.
- **Water shortages:** Communities may experience inadequate or irregular water supply.
- **Fragmented reporting:** Historical incidents and citizen reports may be difficult to connect.
- **Unverified recovery claims:** Estimated runoff, planned recovery, implemented storage, and physically verified water volumes are not the same thing.

JalLoop brings these workflows together in a single application, with an emphasis on evidence, traceability, and human oversight.

## Key Features

### 1. Incident Reporting and Tracking
- Record water-related incidents with location, category, severity, description, and observation time.
- Maintain incident lifecycle and inspection records.
- Surface potential duplicate reports and nearby historical incidents for human review.

### 2. Interactive Incident Map
- Explore incident locations using a map-based interface.
- Support spatial awareness and identification of recurring problem areas.
- Use historical records as maintenance signals rather than automatically merging reports.

### 3. Water Shortage Monitoring
- Record water-shortage reports and affected locations.
- Assess and prioritize shortages using available information and analytical heuristics.
- Support evidence-based follow-up by responsible personnel.

### 4. Rainfall and Recovery Planning
- Estimate theoretical runoff using the Rational Method.
- Calculate potentially collectible water based on collection efficiency.
- Apply storage-capacity constraints to recovery estimates.
- Support catchment-level planning and recovery assessment.

The calculation distinguishes estimated potential from actual water capture.

### 5. Projects and Verification Ledger
- Organize recovery assessments and project reviews.
- Distinguish approved recovery volumes from implemented storage capacity.
- Record physical measurements and verification information.
- Maintain traceability through application records and audit logs.

### 6. AI-Assisted Explanations
- Generate evidence-grounded explanations for incident-related recommendations.
- Identify missing information and state assumptions explicitly.
- Use the Strands Agents SDK integration when configured.
- Fall back to deterministic explanations when the language-model path is unavailable.

AI-generated recommendations are advisory and require human review.

## Technology Stack

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React 19, Vite 7 | User interface and application navigation |
| Mapping | Leaflet | Interactive incident map |
| Main backend | Java, Spring Boot 3.5.6 | Core workflows, business rules, and record management |
| Persistence | Spring Data JPA | Java object-to-database mapping |
| Database | MySQL / H2 | Persistent application records |
| Analysis service | Python, FastAPI | Hydrological calculations and specialized analysis APIs |
| Agent framework | AWS Strands Agents SDK | Structured, evidence-grounded explanations |

## System Architecture

```text
                  User
                   |
                   v
          React + Vite Frontend
                   |
             HTTP / JSON
                   |
                   v
          Spring Boot Backend
             /           \
            v             v
    MySQL / H2       Analysis Requests
                           |
                           v
                  Python FastAPI Service
                           |
              +------------+------------+
              |            |            |
              v            v            v
           Runoff       Shortage     Duplicate /
          Estimates   Prioritization Hotspot Analysis
                           |
                           v
                 Explanation Pipeline
                           |
                  +--------+--------+
                  |                 |
                  v                 v
             Strands Agent    Deterministic
             when configured    Fallback
```

The Spring Boot backend owns authoritative application records and state transitions. The Python analysis service performs specialized calculations and analysis; it is not the primary database writer.

## Hydrological Calculation

JalLoop uses the Rational Method to estimate theoretical runoff volume:

\[
V = {P*A *C}/{1000}
\]

Where:

- \(V\) = theoretical runoff volume in cubic metres (m³)
- \(P\) = rainfall depth in millimetres (mm)
- \(A\) = catchment area in square metres (m²)
- \(C\) = dimensionless runoff coefficient between 0 and 1

**Example**

For 20 mm of rainfall over a 1,000 m² catchment with a runoff coefficient of 0.8:

\[
V = \frac{20 \times 1000 \times 0.8}{1000}
= 16\text{ m}^3
\]

If the assumed collection efficiency is 75%, the potentially collectible volume is 12 m³. If available storage is limited to 10 m³, the storage-constrained estimate is 10 m³.

These figures are illustrative calculations, not measurements of actual recovered water. Real-world outcomes depend on site conditions, rainfall distribution, infiltration, losses, water quality, and infrastructure.

## API Overview

The Python FastAPI analysis service exposes the following operations:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check analysis-service health |
| POST | `/internal/v1/reports/structure` | Structure report information |
| POST | `/internal/v1/reports/duplicate-candidates` | Identify potential duplicate reports |
| POST | `/internal/v1/hotspots/analyze` | Analyze spatial or incident hotspots |
| POST | `/internal/v1/runoff/estimate` | Estimate runoff and potential collection |
| POST | `/internal/v1/recovery/assess` | Assess recovery-planning inputs |
| POST | `/internal/v1/shortages/prioritize` | Prioritize water-shortage cases |
| POST | `/internal/v1/agents/explain` | Generate evidence-grounded explanations |

These endpoints belong to the analysis service. The main Spring Boot backend exposes separate APIs for the application's core workflows.

## AI and Responsible Decision-Making

JalLoop integrates the Strands Agents SDK into its Python analysis service for structured incident-recommendation explanations.

The explanation workflow is designed to:

- Use only the evidence supplied in the request.
- Distinguish recorded observations from recommendations.
- Identify missing information instead of guessing.
- Avoid fabricating rainfall readings, coordinates, laboratory results, or completed repairs.
- Require human review for recommendations.

When the model integration is not configured or fails, a deterministic explanation fallback is available. The fallback uses supplied incident data and rules rather than generating a model-based response.

The presence of the Strands Agents SDK does not by itself mean JalLoop is deployed on AWS. The project can run locally, and the configured model provider depends on the environment.

## Getting Started

### Prerequisites

Install or configure:

- Git
- Node.js and npm
- Java compatible with the project's configuration
- Maven, or the project's included Maven executable
- Python and pip
- MySQL, if using the MySQL profile

The local H2 profile is available as an alternative to MySQL.

### 1. Clone the Repository

```bash
git clone https://github.com/Anushreemazumdar/JalLoop.git
cd JalLoop
```

### 2. Start the Python Analysis Service

Open a terminal:

```powershell
cd ai-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The service health endpoint is available at:

`http://127.0.0.1:8001/health`

### 3. Start the Spring Boot Backend

Open a second terminal:

```powershell
cd backend
```

To run using the local H2 profile, use the included Maven executable if available:

```powershell
& ..\.tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run "-Dspring-boot.run.profiles=local-h2"
```

If using MySQL, configure the database and credentials in the environment and follow the project's MySQL configuration instead.

### 4. Start the Frontend

Open a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173`

Keep all required service terminals running while testing the application.

For the latest project-specific setup guidance, refer to [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Configuration and Environment Variables

Configure database credentials and other environment-specific settings locally. Do not commit secrets or API keys to the repository.

The AI explanation service recognizes:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables the configured OpenAI model integration for the Strands explanation path |
| `STRANDS_MODEL_ID` | Selects the model ID; the code defaults to `gpt-4o-mini` |
| `JALLOOP_FORCE_DETERMINISTIC_AGENT` | Set to `1` to force deterministic explanations |

Without model credentials, the deterministic fallback can support local demonstration and testing.

## Testing

The repository's implementation-status documentation reports:

- **Spring Boot backend:** 9 tests passing.
- **Python analysis service:** 6 tests passing.
- **Frontend:** production build completed successfully.

These are the results recorded in the project documentation; run the relevant test commands in your current environment to verify the present checkout.

## Data Integrity and Safety

JalLoop is designed around several important distinctions:

1. **Estimated runoff is not recovered water.**
2. **Potential duplicate reports are not automatically merged.**
3. **Road runoff or potentially contaminated water must not be automatically approved for reuse.**
4. **AI recommendations do not replace inspections, water-quality testing, or human authorization.**
5. **Demonstration records should be clearly labelled and must not be presented as verified live municipal reports.**

Recovery decisions should be supported by appropriate site inspections, water-quality evidence, and authorized human review.

## Current Scope and Limitations

- Runoff estimates depend on the quality of supplied rainfall, catchment, and coefficient inputs.
- Shortage prioritization is an analytical aid, not a substitute for official assessment.
- Spatial proximity does not prove that two reports refer to the same physical asset.
- AI explanations can be unavailable and may use the deterministic fallback.
- Local execution does not imply production hosting, live municipal integration, or verified field deployment.

## Future Scope

Potential extensions include:

- Integration with verified rainfall and weather data.
- More detailed GIS-based catchment analysis.
- Field-inspection workflows and mobile reporting.
- Water-quality testing records and verification evidence.
- Role-based access and stronger production authentication.
- Deployment and monitoring on appropriate cloud infrastructure.

## Project Structure

```text
JalLoop/
├── frontend/       # React + Vite interface
├── backend/        # Spring Boot application and persistence
├── ai-service/     # FastAPI analysis and explanation service
└── docs/           # Implementation and integration documentation
```

## Acknowledgements

JalLoop is developed for the WeMakeDevs Bharat Builds initiative. The project incorporates the open-source Strands Agents SDK for its agent-based explanation integration.

## License

Add the appropriate license for this repository before redistributing or reusing the project. No license should be assumed unless one is included in the repository.

---

**JalLoop — From water incidents to evidence-based resilience.**
