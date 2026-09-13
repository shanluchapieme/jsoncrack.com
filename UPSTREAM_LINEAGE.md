# Upstream Lineage

This repository is a lawful fork of an Apache-2.0-licensed open-source project,
adapted by Since Tomorrow for internal use as the rendering ancestry of the
**Since Tomorrow Market Explorer**. It is not, and must never be presented as,
"JSON Crack" — see `docs/PRODUCT_IDENTITY.md`.

## Upstream

- **UPSTREAM_REPO**: https://github.com/AykutSarac/jsoncrack.com
- **UPSTREAM_HEAD (pinned)**: `f46579b01be9e5649c4782cbbb45fcd49bb0a9f6` (2026-08-30T18:42:24+03:00)
- **UPSTREAM_LICENSE**: Apache License 2.0 (verified via `LICENSE.md` at the pinned commit and independently via `gh repo view AykutSarac/jsoncrack.com --json licenseInfo` -> `apache-2.0`)
- **NOTICE file**: none exists upstream at the pinned commit — nothing additional to carry beyond `LICENSE.md` itself.
- **Author**: Aykut Saraç (aykutsarac0@gmail.com), per upstream `package.json`.

## Fork

- **FORKED_AT**: 2026-09-13
- **ORIGIN (this fork)**: https://github.com/shanluchapieme/jsoncrack.com (created via `gh repo fork AykutSarac/jsoncrack.com`, same GitHub account already used for Since Tomorrow's deploy repo, `shanluchapieme/sincetmw-deploy`)
- **Local sibling working tree**: `C:\SinceTomorrow\since-tomorrow-market-explorer`
- **Remotes**: `origin` = the Since-Tomorrow-owned fork above; `upstream` = the original AykutSarac/jsoncrack.com repo (retained for future upstream merges).

## Structure derived from

pnpm/turborepo monorepo:
- `apps/www` — the original jsoncrack.com Next.js web app (the piece being adapted into the Market Explorer product surface)
- `apps/chrome-extension`, `apps/vscode` — not used by this fork; left untouched, not deployed
- `packages/jsoncrack-react` — the reusable graph-rendering React component (the actual rendering ancestry reused by the Market Explorer)

## Since Tomorrow modifications (this fork only, tracked here as they land)

| Date | Change | Files |
|---|---|---|
| 2026-09-13 | Repo forked, lineage recorded, no product code modified yet at this entry | this file |

Apache License 2.0 §4(b) requires stating that files have been changed. Every
Since-Tomorrow-authored file added on top of the upstream tree carries a header
comment: `// Since Tomorrow addition -- not part of upstream jsoncrack.com`.
Any upstream file actually edited (not merely added alongside) will get a
`// SINCE_TOMORROW_MODIFIED: <what changed>` comment at the edit site and a row
in the table above.

## Trademark note

"JSON Crack" is the upstream project's own branding. This fork's product
identity is **Since Tomorrow Market Explorer** — see `docs/PRODUCT_IDENTITY.md`.
No upstream branding, logo, or trademark is reused as Since Tomorrow branding.
