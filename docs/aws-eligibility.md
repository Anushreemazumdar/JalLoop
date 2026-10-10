# AWS Open-Source Integration & Eligibility Evidence

## 1. Hackathon Eligibility Context

**Hackathon:** WeMakeDevs Bharat Builds Tour  
**Track Requirement:**
Under the official Bharat Builds rules (in partnership with AWS Builder Center), a project qualifies for the AWS track if it satisfies at least one of the following criteria:
1. **Uses at least one AWS open-source tool**, OR
2. **Is deployed on AWS**.

Because we are participating under **Build It, not Ship It**, cloud deployment is not currently required; the application is designed and tested to execute locally on the developer machine.

---

## 2. Integrated AWS Open-Source Tool

- **Tool Name:** Strands Agents SDK (`strands-agents`)
- **Official Repository:** [https://github.com/strands-agents](https://github.com/strands-agents) (Harness SDK: [https://github.com/strands-agents/harness-sdk](https://github.com/strands-agents/harness-sdk))
- **AWS Samples & Learning Path:** [https://github.com/aws-samples/sample-getting-started-with-strands-agents-course](https://github.com/aws-samples/sample-getting-started-with-strands-agents-course)
- **Official Documentation:** [https://strandsagents.com](https://strandsagents.com)
- **License:** **Apache License 2.0** (Open Source, permissive)
- **Package:** `strands-agents==1.18.0` (Python PyPI)

---

## 3. Role in JalLoop Architecture

In JalLoop, the Strands Agents SDK is integrated into the Python FastAPI microservice (`ai-service/app/agents/explain.py` and route `/internal/v1/agents/explain`):

### Feature Role: Grounded Incident Recommendation Explainer
1. **Context Ingestion:** Accepts canonical incident records, citizen report transcripts, nearby spatial recurrence candidates (historical failures within radius), and inspector findings.
2. **Grounded Synthesis:** Uses Strands structured outputs (`ExplanationModel`) to explain why a specific maintenance action is recommended based **only** on provided evidence.
3. **Hallucination Prevention:** The agent prompt explicitly forbids inventing rainfall, coordinates, lab test readings, or civic outcomes. Missing details are flagged under `missingInformation`.
4. **Mandatory Human Governance:** Every output enforces `humanReviewRequired = true`. Recommendations are advisory maintenance signals.

---

## 4. Deterministic Fallback & Zero-Cloud Local Operation

To ensure the application functions without requiring paid cloud APIs or proprietary AWS credentials:

1. **Automatic Fallback:**
   If `OPENAI_API_KEY` is absent, or if the environment variable `JALLOOP_FORCE_DETERMINISTIC_AGENT=1` is set, `explain.py` switches to `deterministic_explain()`.
2. **Fault Tolerance:**
   If the Strands invocation raises any exception (e.g. network timeout or missing dependency), the exception is caught safely, and the deterministic explanation is returned with `usedFallback: true` and an explicit diagnostic confidence note.
3. **Database Ownership Integrity:**
   The AI service is strictly analytical and read-only with respect to the core database. All state transitions, assignments, inspections, and verifications are owned and persisted by the Spring Boot backend with JPA audit logs.

---

## 5. Verification Checklist

| Criterion | Status | Evidence |
| :--- | :--- | :--- |
| AWS Open-Source Tool Identified | PASS | Strands Agents SDK (`strands-agents`, Apache 2.0) |
| Local Execution Capability | PASS | Integrated in `ai-service/app/agents/explain.py` |
| Fallback without Paid Cloud Keys | PASS | Validated in `tests/test_analysis.py` (`test_explain_fallback_without_keys`) |
| No Fabricated Claims | PASS | Documented source repositories and fallback mechanism |
| Clean Separation of Calculations | PASS | Rational runoff equation \(V = P \cdot A \cdot C / 1000\) computed deterministically in `runoff.py` |
