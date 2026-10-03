# HERIT Autonomous Handoff — 2026-10-03

## Completed
- Branch: `fix/herit-lens-mobile-sheet-v217`
- Parent: `f32ccdac053229a1a9732ad8672a80a6b0b3aa7c`
- Implementation commit: `6b0200397107704ea302c03c5c76c1c96d0cefd5`
- Pull request: #2, targeting `recovery/herit-lens-v1.9-2026-10-02`
- Mobile building sheet now presents address first, then factual building data and provenance.
- Technical identity fields are collapsed under “Identité & détails techniques”.
- Fixed stale `openSheet` listener so the final address/cloud wrapper executes.
- Parallelized five independent cloud reads after scan synchronization.
- Bumped PWA shell and app/style asset versions to 2.17.
- No Weather card was added because this surface has no validated Weather state.

## Evidence
- Remote compare: 1 commit ahead of recovery base; 4 product files changed.
- DOM IDs preserved and checked for uniqueness.
- `docs/app.js` parsed successfully as an ES module with Node `vm.SourceTextModule`.
- No Next.js, scoring, ingestion, database, authorization, billing, or RLS code changed.

## Blockers / risks
- PR has no GitHub Actions run because CI only targets `main`.
- Vercel status is failing; this is not a verified deployment.
- Manual mobile/PWA QA is still required at 320, 375 and 430 px in signed-out, signed-in/no-data, signed-in/data, address-failure and cloud-failure states.
- Separate security issue: privileged Edge Function reads need an explicit server-side ownership/team/entitlement audit; do not mix that change into this UI PR.

## Next action
1. Run the manual mobile matrix on PR #2.
2. Diagnose the Vercel failure without changing application behavior.
3. Merge only after the building sheet and installed-PWA refresh are verified.
4. Then isolate and repair Edge Function authorization boundaries as a separate change.
