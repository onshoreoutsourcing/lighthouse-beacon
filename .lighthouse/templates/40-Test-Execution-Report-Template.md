# Test Execution Report

**Project**: {{PROJECT_NAME}} **Test Date**: {{TEST_DATE}} **Test Cycle**:
{{TEST_CYCLE}} (e.g., Sprint 5, Release 2.1, Regression) **Tester**:
{{TESTER_NAME}} **Environment**: {{TEST_ENVIRONMENT}} (e.g., QA, Staging,
Production-like)

---

## Test Summary

### Test Execution Statistics

- **Total Test Cases**: {{TOTAL_TESTS}}
- **Passed**: {{PASSED_COUNT}} ({{PASS_RATE}}%)
- **Failed**: {{FAILED_COUNT}} ({{FAIL_RATE}}%)
- **Blocked**: {{BLOCKED_COUNT}}
- **Not Executed**: {{NOT_RUN_COUNT}}
- **Test Pass Rate**: {{PASS_RATE}}% (Target: ≥95%)

### Test Coverage

- **Unit Test Coverage**: {{UNIT_COVERAGE}}% (Target: ≥{{UNIT_TARGET}}%)
- **Integration Test Coverage**: {{INTEGRATION_COVERAGE}}% (Target:
  ≥{{INTEGRATION_TARGET}}%)
- **E2E Test Coverage**: {{E2E_COVERAGE}}% (Target: ≥{{E2E_TARGET}}%)
- **Code Coverage**: {{CODE_COVERAGE}}%

### Test Execution Time

- **Total Execution Time**: {{TOTAL_EXECUTION_TIME}}
- **Unit Tests**: {{UNIT_TEST_TIME}}
- **Integration Tests**: {{INTEGRATION_TEST_TIME}}
- **E2E Tests**: {{E2E_TEST_TIME}}

---

## Defects Found

### Critical Defects ({{CRITICAL_COUNT}})

#### Defect #{{DEFECT_ID_1}}: {{DEFECT_TITLE_1}}

- **Severity**: Critical
- **Priority**: P0
- **Status**: {{DEFECT_STATUS_1}}
- **Component**: {{COMPONENT_1}}
- **Brief**: {{BRIEF_DESCRIPTION_1}}

### High Priority Defects ({{HIGH_COUNT}})

#### Defect #{{DEFECT_ID_2}}: {{DEFECT_TITLE_2}}

- **Severity**: High
- **Priority**: P1
- **Status**: {{DEFECT_STATUS_2}}
- **Component**: {{COMPONENT_2}}
- **Brief**: {{BRIEF_DESCRIPTION_2}}

### Medium Priority Defects ({{MEDIUM_COUNT}})

#### Defect #{{DEFECT_ID_3}}: {{DEFECT_TITLE_3}}

- **Severity**: Medium
- **Priority**: P2
- **Status**: {{DEFECT_STATUS_3}}
- **Component**: {{COMPONENT_3}}
- **Brief**: {{BRIEF_DESCRIPTION_3}}

### Low Priority Defects ({{LOW_COUNT}})

{{LOW_PRIORITY_DEFECT_SUMMARY}}

---

## Detailed Defect Reports

### Defect #{{DEFECT_ID}}: {{DEFECT_TITLE}}

**Severity**: {{SEVERITY}} (Critical/High/Medium/Low) **Priority**: {{PRIORITY}}
(P0/P1/P2/P3) **Status**: {{STATUS}} (New/Open/In
Progress/Fixed/Verified/Closed) **Assigned To**: {{ASSIGNEE}}

#### Environment

- **Browser**: {{BROWSER_VERSION}} (e.g., Chrome 120.0.6099.109)
- **OS**: {{OS_VERSION}} (e.g., macOS 14.1, Windows 11)
- **URL**: {{PAGE_URL}}
- **User Type**: {{USER_ROLE}} (e.g., Admin, Regular User, Guest)
- **Build**: {{BUILD_VERSION}}

#### Reproduction Steps

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{STEP_4}}

#### Expected Result

{{EXPECTED_BEHAVIOR}}

#### Actual Result

{{ACTUAL_BEHAVIOR}}

#### Evidence

- **Screenshot**: {{SCREENSHOT_PATH}}
- **Console Errors**:

```
{{CONSOLE_ERROR_TEXT}}
```

- **Network Logs**: {{NETWORK_LOG_DETAILS}}
- **Video Recording**: {{VIDEO_PATH}}
- **Stack Trace**:

```
{{STACK_TRACE}}
```

#### Impact

- **User Impact**: {{USER_IMPACT_DESCRIPTION}}
- **Frequency**: {{FREQUENCY}} (Always/Often/Sometimes/Rare)
- **Workaround Available**: {{WORKAROUND_STATUS}}

#### Additional Notes

{{NOTES}}

---

## Performance Results

### Response Time Metrics

- **Average Response Time**: {{AVG_RESPONSE_MS}}ms (Target:
  {{RESPONSE_TARGET}}ms)
- **95th Percentile**: {{P95_RESPONSE_MS}}ms
- **99th Percentile**: {{P99_RESPONSE_MS}}ms
- **Max Response Time**: {{MAX_RESPONSE_MS}}ms

### Core Web Vitals

- **First Contentful Paint**: {{FCP_MS}}ms (Target: {{FCP_TARGET}}ms)
- **Largest Contentful Paint**: {{LCP_MS}}ms (Target: {{LCP_TARGET}}ms)
- **Cumulative Layout Shift**: {{CLS_SCORE}} (Target: {{CLS_TARGET}})
- **Time to Interactive**: {{TTI_MS}}ms (Target: {{TTI_TARGET}}ms)
- **Total Blocking Time**: {{TBT_MS}}ms

### Load Testing Results

- **Concurrent Users**: {{CONCURRENT_USERS}}
- **Requests per Second**: {{RPS}}
- **Error Rate**: {{ERROR_RATE}}% (Target: <0.1%)
- **Success Rate**: {{SUCCESS_RATE}}%

### Performance Issues Found

{{PERFORMANCE_ISSUES_DESCRIPTION}}

---

## Coverage Analysis

### Code Coverage Summary

- **Lines Covered**: {{LINES_COVERED}} / {{TOTAL_LINES}} ({{LINE_COVERAGE}}%)
- **Branches Covered**: {{BRANCHES_COVERED}} / {{TOTAL_BRANCHES}}
  ({{BRANCH_COVERAGE}}%)
- **Functions Covered**: {{FUNCTIONS_COVERED}} / {{TOTAL_FUNCTIONS}}
  ({{FUNCTION_COVERAGE}}%)

### Coverage Gaps

**Uncovered Critical Paths:**

- {{UNCOVERED_PATH_1}}
- {{UNCOVERED_PATH_2}}

**Components with Low Coverage (< {{MIN_COVERAGE}}%):**

- {{LOW_COVERAGE_COMPONENT_1}}: {{COVERAGE_1}}%
- {{LOW_COVERAGE_COMPONENT_2}}: {{COVERAGE_2}}%

### Coverage Improvements Needed

{{COVERAGE_IMPROVEMENT_RECOMMENDATIONS}}

---

## Cross-Browser & Device Testing

### Browser Compatibility Results

| Browser | Version             | Status             | Issues             |
| ------- | ------------------- | ------------------ | ------------------ |
| Chrome  | {{CHROME_VERSION}}  | {{CHROME_STATUS}}  | {{CHROME_ISSUES}}  |
| Firefox | {{FIREFOX_VERSION}} | {{FIREFOX_STATUS}} | {{FIREFOX_ISSUES}} |
| Safari  | {{SAFARI_VERSION}}  | {{SAFARI_STATUS}}  | {{SAFARI_ISSUES}}  |
| Edge    | {{EDGE_VERSION}}    | {{EDGE_STATUS}}    | {{EDGE_ISSUES}}    |

### Device Testing Results

| Device       | OS       | Status       | Issues       |
| ------------ | -------- | ------------ | ------------ |
| {{DEVICE_1}} | {{OS_1}} | {{STATUS_1}} | {{ISSUES_1}} |
| {{DEVICE_2}} | {{OS_2}} | {{STATUS_2}} | {{ISSUES_2}} |

---

## Accessibility Testing

### WCAG Compliance

- **WCAG Level**: {{WCAG_LEVEL}} (e.g., 2.1 Level AA)
- **Compliance Score**: {{ACCESSIBILITY_SCORE}}%
- **Issues Found**: {{ACCESSIBILITY_ISSUE_COUNT}}

### Accessibility Issues

- **Critical**: {{A11Y_CRITICAL_COUNT}}
- **High**: {{A11Y_HIGH_COUNT}}
- **Medium**: {{A11Y_MEDIUM_COUNT}}
- **Low**: {{A11Y_LOW_COUNT}}

### Screen Reader Testing

- **NVDA**: {{NVDA_STATUS}}
- **JAWS**: {{JAWS_STATUS}}
- **VoiceOver**: {{VOICEOVER_STATUS}}

---

## Security Testing

### Security Scan Results

- **Security Vulnerabilities Found**: {{SECURITY_VULN_COUNT}}
- **Critical**: {{SECURITY_CRITICAL}}
- **High**: {{SECURITY_HIGH}}
- **Medium**: {{SECURITY_MEDIUM}}
- **Low**: {{SECURITY_LOW}}

### Security Issues Summary

{{SECURITY_ISSUES_SUMMARY}}

---

## Recommendations

### Immediate Actions Required

1. {{IMMEDIATE_ACTION_1}}
2. {{IMMEDIATE_ACTION_2}}

### Quality Improvements Needed

1. {{QUALITY_IMPROVEMENT_1}}
2. {{QUALITY_IMPROVEMENT_2}}

### Test Coverage Gaps to Address

1. {{COVERAGE_GAP_1}}
2. {{COVERAGE_GAP_2}}

### Performance Optimizations

1. {{PERFORMANCE_OPTIMIZATION_1}}
2. {{PERFORMANCE_OPTIMIZATION_2}}

---

## Release Readiness Assessment

### Quality Gate Status

- [ ] Unit test coverage ≥ {{UNIT_TARGET}}%: {{UNIT_GATE_STATUS}}
- [ ] Integration test coverage ≥ {{INTEGRATION_TARGET}}%:
      {{INTEGRATION_GATE_STATUS}}
- [ ] Zero critical or high severity defects: {{DEFECT_GATE_STATUS}}
- [ ] Performance benchmarks met: {{PERFORMANCE_GATE_STATUS}}
- [ ] Security scan passed: {{SECURITY_GATE_STATUS}}
- [ ] Accessibility compliance verified: {{ACCESSIBILITY_GATE_STATUS}}
- [ ] Cross-browser compatibility confirmed: {{COMPATIBILITY_GATE_STATUS}}

### Release Recommendation

**Status**: {{RELEASE_RECOMMENDATION}} (Go/No-Go/Conditional)

**Justification**: {{RELEASE_JUSTIFICATION}}

**Conditions (if conditional)**:

- {{CONDITION_1}}
- {{CONDITION_2}}

---

## Appendix

### Test Environment Details

{{TEST_ENVIRONMENT_DETAILS}}

### Test Data Used

{{TEST_DATA_DESCRIPTION}}

### Testing Tools & Frameworks

- {{TOOL_1}}: {{VERSION_1}}
- {{TOOL_2}}: {{VERSION_2}}

### Known Limitations

{{TEST_LIMITATIONS}}

### Next Testing Cycle

- **Date**: {{NEXT_TEST_DATE}}
- **Focus Areas**: {{NEXT_FOCUS_AREAS}}
