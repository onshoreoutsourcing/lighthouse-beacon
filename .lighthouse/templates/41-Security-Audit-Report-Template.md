# Security Audit Report

**Project**: {{PROJECT_NAME}} **Audit Date**: {{AUDIT_DATE}} **Auditor**:
{{AUDITOR_NAME}} **Audit Scope**: {{AUDIT_SCOPE}}

---

## Executive Summary

### Vulnerability Overview

- **Critical**: {{CRITICAL_COUNT}} vulnerabilities
- **High**: {{HIGH_COUNT}} vulnerabilities
- **Medium**: {{MEDIUM_COUNT}} vulnerabilities
- **Low**: {{LOW_COUNT}} vulnerabilities
- **Total**: {{TOTAL_VULN_COUNT}} vulnerabilities

### Critical Findings Requiring Immediate Attention

{{CRITICAL_FINDINGS_SUMMARY}}

### Overall Security Posture Assessment

{{SECURITY_POSTURE_RATING}} (Critical/Poor/Fair/Good/Excellent)

**Key Strengths:**

- {{STRENGTH_1}}
- {{STRENGTH_2}}

**Key Weaknesses:**

- {{WEAKNESS_1}}
- {{WEAKNESS_2}}

### Compliance Status Summary

- **OWASP Top 10**: {{OWASP_COMPLIANCE_STATUS}}
- **{{COMPLIANCE_FRAMEWORK}}**: {{FRAMEWORK_COMPLIANCE_STATUS}}
- **Regulatory Requirements**: {{REGULATORY_COMPLIANCE_STATUS}}

---

## Technical Findings

### Vulnerability #{{VULN_NUMBER}}: {{VULNERABILITY_TITLE}}

**Severity**: {{SEVERITY}} (Critical/High/Medium/Low) **CVSS Score**:
{{CVSS_SCORE}} **CWE**: {{CWE_NUMBER}} **OWASP**: {{OWASP_CATEGORY}}

#### Location

- **File**: {{FILE_PATH}}
- **Line Numbers**: {{LINE_NUMBERS}}
- **Component**: {{COMPONENT_NAME}}

#### Description

{{TECHNICAL_VULNERABILITY_DESCRIPTION}}

#### Evidence

{{EVIDENCE_DESCRIPTION}}

**Proof of Concept:**

```
{{POC_CODE_OR_STEPS}}
```

**Screenshots/Logs:**

- {{SCREENSHOT_PATH_1}}
- {{LOG_EXCERPT}}

#### Impact

**Technical Impact:** {{TECHNICAL_IMPACT_DESCRIPTION}}

**Business Impact:** {{BUSINESS_IMPACT_DESCRIPTION}}

**Affected Assets:**

- {{AFFECTED_ASSET_1}}
- {{AFFECTED_ASSET_2}}

#### Remediation

**Immediate Actions (< 24 hours):**

- {{IMMEDIATE_ACTION_1}}
- {{IMMEDIATE_ACTION_2}}

**Short-term Fixes (< 1 week):**

- {{SHORT_TERM_FIX_1}}
- {{SHORT_TERM_FIX_2}}

**Long-term Improvements (< 1 month):**

- {{LONG_TERM_IMPROVEMENT_1}}
- {{LONG_TERM_IMPROVEMENT_2}}

**Code Fix Example:**

```{{LANGUAGE}}
{{CODE_FIX_EXAMPLE}}
```

#### References

- CVE: {{CVE_NUMBER}}
- CWE: {{CWE_LINK}}
- OWASP: {{OWASP_LINK}}
- Additional Resources: {{RESOURCE_LINKS}}

---

## Compliance Assessment

### Standards Compliance Matrix

| Standard       | Requirement       | Status       | Gaps      | Priority       |
| -------------- | ----------------- | ------------ | --------- | -------------- |
| {{STANDARD_1}} | {{REQUIREMENT_1}} | {{STATUS_1}} | {{GAP_1}} | {{PRIORITY_1}} |
| {{STANDARD_2}} | {{REQUIREMENT_2}} | {{STATUS_2}} | {{GAP_2}} | {{PRIORITY_2}} |

### Regulatory Requirement Gaps

{{REGULATORY_GAPS_DESCRIPTION}}

### Policy Violation Summary

- {{POLICY_VIOLATION_1}}
- {{POLICY_VIOLATION_2}}

### Recommended Improvements

1. {{COMPLIANCE_IMPROVEMENT_1}}
2. {{COMPLIANCE_IMPROVEMENT_2}}

---

## Remediation Roadmap

### Immediate Actions (Week 1)

| Action       | Owner       | Deadline       | Status       |
| ------------ | ----------- | -------------- | ------------ |
| {{ACTION_1}} | {{OWNER_1}} | {{DEADLINE_1}} | {{STATUS_1}} |
| {{ACTION_2}} | {{OWNER_2}} | {{DEADLINE_2}} | {{STATUS_2}} |

### Short-term Fixes (Weeks 2-4)

| Action       | Owner       | Deadline       | Status       |
| ------------ | ----------- | -------------- | ------------ |
| {{ACTION_3}} | {{OWNER_3}} | {{DEADLINE_3}} | {{STATUS_3}} |
| {{ACTION_4}} | {{OWNER_4}} | {{DEADLINE_4}} | {{STATUS_4}} |

### Long-term Improvements (Months 2-3)

| Action       | Owner       | Deadline       | Status       |
| ------------ | ----------- | -------------- | ------------ |
| {{ACTION_5}} | {{OWNER_5}} | {{DEADLINE_5}} | {{STATUS_5}} |
| {{ACTION_6}} | {{OWNER_6}} | {{DEADLINE_6}} | {{STATUS_6}} |

### Resource Requirements

- **Development**: {{DEV_RESOURCES}}
- **Security Tools**: {{SECURITY_TOOLS}}
- **Training**: {{TRAINING_NEEDS}}
- **Budget**: {{BUDGET_ESTIMATE}}

### Success Metrics

- {{SUCCESS_METRIC_1}}
- {{SUCCESS_METRIC_2}}
- {{SUCCESS_METRIC_3}}

---

## Appendix

### Testing Methodology

{{TESTING_METHODOLOGY_DESCRIPTION}}

### Tools Used

- {{TOOL_1}}: {{TOOL_VERSION_1}}
- {{TOOL_2}}: {{TOOL_VERSION_2}}

### Audit Limitations

{{AUDIT_LIMITATIONS}}

### Next Audit Recommendations

- **Next Audit Date**: {{NEXT_AUDIT_DATE}}
- **Focus Areas**: {{NEXT_AUDIT_FOCUS}}
