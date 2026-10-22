# Repository controls and setup evidence

## Repository controls

Shared work follows [AGENTS.md](../AGENTS.md). The owner grants repository-scoped access; service access is separate. Identify the commit and limits when working from a snapshot. These controls describe intended settings; the dated evidence below is not proof of current configuration. Verify settings before relying on enforcement.

| Setting | Intended value |
| --- | --- |
| Main ruleset | PR required; `privacy-guard` required; force pushes and deletion blocked |
| Required approvals / Code Owners | Zero required approvals; Code Owner review off. Both assistants share one identity; `.github/CODEOWNERS` is advisory and those paths still need the owner's attention before merge authorization |
| Merge methods / branch cleanup | Squash only; automatic head-branch deletion |
| Actions | Read-only workflow permissions; approval for all external fork contributors |
| Secret Protection / push protection | On |

GitHub's zero-approval setup does not enforce owner merge authorization or independent review; AGENTS retains those requirements. Report unavailable controls rather than buying an upgrade. Keep **Allow edits from maintainers** enabled for fork contributions when available. Verify current vendor documentation and observed settings for service instructions; report inaccessible state as unverified. Credentials and infrastructure identifiers stay out of public records. If exposed, notify the owner and rotate affected credentials. Publication requirements remain in [technical decisions](TECHNICAL_DESIGN_DECISIONS.md#7-public-repository-governance-and-minimum-cost-ci).


## Historical setup and validation evidence

This public repository started from a sanitized, history-free baseline on 2026-10-10. The dated foundation, identity, engine and child-UI evidence (including source revisions, test limits and owner decisions) is retained in the [unchanged historical record](https://github.com/FrankxSG/turtle-academy/pull/31#issuecomment-6340409868). It is not a current implementation inventory or an instruction to repeat completed work.

Use the current [README](../README.md), affected code-area guide and PR/CI evidence for implementation status. Current architecture and open protection decisions belong in [technical decisions](TECHNICAL_DESIGN_DECISIONS.md); delivery requirements belong in the [Pilot scope](PILOT_V0_1_SCOPE.md). Record new work in its Issue/PR, not this file.
