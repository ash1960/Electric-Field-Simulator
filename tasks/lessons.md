# Lessons Log

Append-only log of lessons learned. Every lesson must produce an actionable rule.
Format: `[YYYY-MM-DD] <Mistake> → <Root Cause> → <Rule added>`.

---

[2026-04-18] Wrote `U = 8.99×10⁻²` as the expected energy in the Phase 1 validation, off by a factor of 1000. → Mental arithmetic on `k·Q·q/r = 8.99e9 · 1e-6 · 1e-9 / 0.1` skipped a power of ten when chaining the exponents. → **Rule:** Whenever an expected SI value combines four or more powers of ten, write the exponent arithmetic out longhand in the source comment (`8.99e9 · 1e-6 · 1e-9 / 0.1 → 8.99e-5`) before typing the assertion. The comment doubles as the regression-proof of the test.

[2026-04-18] [token-efficiency] Read all 1,225 lines of `README.md` during `/sc:load` when only the "Phase 0/1" sections and the architecture diagram were needed. → Defaulted to `Read` instead of using `Grep -C 5` for targeted lookup, because the file was already the "authoritative" doc. → **Rule:** For files >300 lines, never `Read` whole; first `Grep -C 5` for the section needed (e.g. `^## Phase 1`, `### File Structure`). `Read` the full file only after grep proves the answer is scattered across many sections.
