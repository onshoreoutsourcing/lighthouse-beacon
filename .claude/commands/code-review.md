You are performing a comprehensive code review of the entire project.

## Task

Review all code files in the project systematically and create a detailed code
review report.

## Grading Criteria

Grade each file on a 1-10 scale (10 being highest) for:

- **Code Quality (CQ):** Organization, readability, maintainability, design
  patterns, adherence to language conventions
- **Security (SEC):** Input validation, error handling, authentication, data
  protection, secure coding practices
- **Functionality (FUNC):** Completeness, correctness, performance, reliability,
  error handling

## Review Process

1. Read project documentation (README, architecture docs, CLAUDE.md if present)
   to understand:
   - Project purpose and architecture
   - Technology stack and frameworks
   - Design patterns and conventions
   - Key components and data flow
2. Identify all source code files (exclude dependency folders like node_modules,
   venv, packages, dist, build, bin, obj)
3. Organize files by logical categories based on project structure:
   - Core business logic / services
   - Data models / types / interfaces
   - Utilities / helpers
   - API / interface layers (REST, CLI, UI handlers)
   - Configuration files
   - Entry points (main, index, program files)
4. For each file:
   - Assign individual grades (CQ, SEC, FUNC) and overall grade
   - List specific strengths with line numbers
   - List specific issues with line numbers and code examples
   - Provide actionable recommendations with priority levels (HIGH/MEDIUM/LOW)

## Output Format

Create `Docs/CODE_REVIEW_REPORT.md` with:

### Structure

1. **Executive Summary:** Overall project grade, technology stack, and key
   findings
2. **Individual File Reviews:** One section per file with:
   - Grade and star rating (⭐⭐⭐⭐⭐ for 9-10, ⭐⭐⭐⭐ for 7-8, etc.)
   - Breakdown of CQ/SEC/FUNC scores
   - Strengths (bulleted list with line references)
   - Issues (bulleted list with line references and code examples)
   - Recommendations (prioritized as HIGH/MEDIUM/LOW)
3. **Category Summaries:** Average grades by logical category with strengths and
   weaknesses
4. **Security Analysis:**
   - Security strengths ✅
   - Security concerns ⚠️
   - Security recommendations 🔒 (prioritized)
5. **Performance Considerations:**
   - Performance strengths ⚡
   - Performance concerns 🐌
   - Performance recommendations 🚀 (prioritized)
6. **Critical Issues:** Must-fix items organized by priority
   - HIGH PRIORITY (blocks production)
   - MEDIUM PRIORITY (should fix soon)
   - LOW PRIORITY (technical debt)
7. **Recommendations by Priority:** Consolidated action items
   - High Priority (Do First)
   - Medium Priority (Do Next)
   - Low Priority (Nice to Have)
8. **Best Practices Observed:** 👏 What's done well
9. **Testing Assessment:** Current test coverage and recommendations
10. **Overall Assessment:**
    - Project grade with star rating
    - Production readiness percentage
    - What's ready vs. what needs work
    - Recommended path forward (phases)
    - Final thoughts

### Grading Scale

- **9-10 (⭐⭐⭐⭐⭐):** Excellent, production-ready, best practices followed
- **7-8 (⭐⭐⭐⭐):** Good, solid implementation, minor improvements needed
- **5-6 (⭐⭐⭐):** Adequate, functional but significant improvements
  recommended
- **3-4 (⭐⭐):** Poor, major issues present, refactoring required
- **1-2 (⭐):** Critical issues, not functional or severe problems

### Analysis Requirements

- Reference specific line numbers for all issues (e.g., "line 145", "lines
  320-335")
- Provide code examples for problems (show the problematic code)
- Explain WHY something is an issue, not just WHAT (context matters)
- Consider real-world usage patterns, not just theoretical edge cases
- Prioritize recommendations realistically (HIGH/MEDIUM/LOW)
- Be thorough but practical in suggestions
- Consider language-specific best practices and idioms
- Check for common vulnerability patterns (OWASP, CWE)
- Evaluate error handling and edge case coverage
- Assess test coverage and quality

## Language-Specific Considerations

### For All Languages

- Consistent naming conventions
- Proper error handling and logging
- Input validation and sanitization
- Resource management (connections, files, memory)
- Code duplication and DRY principle
- Separation of concerns
- Documentation quality
- Test coverage

### TypeScript/JavaScript

- Type safety and strict mode usage
- Async/await vs. callbacks vs. promises
- Memory leaks (event listeners, timers, caches)
- Bundle size and performance
- Dependency management and security

### Python

- PEP 8 compliance and Pythonic idioms
- Type hints usage (Python 3.5+)
- Context managers for resources
- Virtual environment and dependency management
- Common security issues (pickle, eval, SQL injection)

### C#

- .NET conventions and framework guidelines
- SOLID principles adherence
- Dispose pattern and IDisposable
- Async/await usage and Task patterns
- Exception handling best practices
- Dependency injection patterns

## Important Guidelines

- **Do NOT recommend features the user doesn't want** - Ask clarifying questions
  first
- **Do NOT assume missing features are bugs** - Check if functionality is
  intentionally simple
- **Do NOT mark code as incomplete without evidence** - Verify your assumptions
- **DO consider the actual architecture** - Understand data flow and design
  decisions
- **DO verify how code is used** - Check for actual callers and usage patterns
- **DO ask questions** - If recommendations might add unnecessary complexity
- **DO respect project maturity** - Early-stage projects don't need enterprise
  patterns
- **DO consider team size and context** - Not every project needs extensive
  testing/monitoring

## Interactive Review Process

After creating the initial report, be prepared to:

1. **Go through sections with the user** - Review findings one by one
2. **Validate architectural assumptions** - Correct misunderstandings about
   design
3. **Incorporate real-world data** - Update based on actual usage patterns
4. **Remove unnecessary recommendations** - Cut suggestions for unneeded
   features
5. **Refine priorities** - Adjust based on project goals and timeline
6. **Update report iteratively** - Make corrections as you learn more

## Example Analysis Format

````markdown
#### FileName.ext

**Grade: 8.5/10** ⭐⭐⭐⭐

- **CQ: 9/10** - Excellent organization and readability
- **SEC: 8/10** - Good security practices with minor gaps
- **FUNC: 8.5/10** - Solid functionality with edge cases covered

**Strengths:**

- Clear separation of concerns (lines 45-120)
- Comprehensive error handling with context (lines 88-95)
- Well-documented public API (lines 12-30)
- Efficient algorithm implementation (line 156)

**Issues:**

- **HIGH PRIORITY:** SQL injection vulnerability in query builder (line 234)
  ```language
  query = "SELECT * FROM users WHERE id = " + userId  // Vulnerable!
  ```
````

- **MEDIUM PRIORITY:** Unbounded cache grows indefinitely (line 67)
- **LOW PRIORITY:** Magic numbers should be constants (lines 145, 178, 203)

**Recommendations:**

- **HIGH PRIORITY:** Use parameterized queries or ORM
- **MEDIUM PRIORITY:** Implement LRU cache with max size
- **LOW PRIORITY:** Extract magic numbers to named constants

```

## Notes
- Focus on actionable feedback, not academic perfection
- Consider maintenance burden vs. benefit for recommendations
- Highlight what's done well, not just problems
- Be specific about how to fix issues
- Respect different coding styles (as long as consistent)
```
