# Security Policy

## Supported Versions

Texture Genetics tracks the latest minor on the `main` branch. Older minors do
not receive security fixes.

| Branch | Supported          |
| ------ | ------------------ |
| `main` | Yes                |
| older  | No                 |

## Reporting a Vulnerability

Please **do not file public issues** for suspected vulnerabilities.

Open a private report at: <https://github.com/gvastethecreator/texture-genetics/security/advisories/new>

If GitHub private advisories are unavailable in your region, open a minimal
issue titled `Security: <short summary>` and request a private channel. The
maintainer will respond and convert the report to a private thread.

Include:

1. A short description of the vulnerability and the impact.
2. Reproduction steps (browser, OS, sample texture or pattern, build commit).
3. A minimal proof-of-concept (link, screenshot, or `dist/` artifact is fine).

## Response Targets

- **Acknowledge:** within 7 days.
- **Triage and severity:** within 14 days.
- **Fix and disclosure:** coordinated with the reporter. Default embargo is
  30 days from the acknowledgement, extendable for complex reports.

## Scope

In scope for this project:

- Anything that lets a remote page or file read/write data outside the
  expected sandbox (IndexedDB, `localStorage`, parent app via `postMessage`).
- Shader compilation paths that could lead to GPU driver crashes or unhandled
  exceptions across browsers.
- Supply-chain risks in the dependency tree (report privately; do not file a
  public CVE for transitive dependencies without coordination).
