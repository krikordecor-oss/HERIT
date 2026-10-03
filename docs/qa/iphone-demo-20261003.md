# iPhone building sheet — 2026-10-03

## Scope

Static HERIT Lens application in `docs/`, based on branch `herit-lens`, commit
`7752db29ed673a6643103c46d1cc87c8113c72a3`. No Next.js application, database,
permissions, scoring algorithm or production deployment changes.

- Address-led building sheet, with available facts before advanced analysis.
- Dedicated `building-sheet.css` for sheet presentation; targeting remains independent.
- Dedicated `sheet-dialog.js` for focus containment, Escape, focus restoration,
  scroll reset and collapsed details on every new opening.
- Freeze the selected target while its sheet is open. Invalidate pending responses
  when closing or opening a different sheet. Resolve identity before cloud scan
  synchronization, then fetch cloud enrichments against the returned building ID.
- Distinguish a nearby reverse-geocoded address from a building-linked address.
- Keep forecasts collapsed and unvalidated. Save labels describe bookmarking,
  not monitoring or alerts.
- Rotate the shell cache and include new UI assets.

## Validation and release gate

JavaScript syntax, HTML unique IDs/local asset existence and focused asynchronous
regressions are checked locally. Test fixtures do not represent live building data.

Visual/browser validation is NOT completed: browser package download failed and
remote browser access to the local preview was blocked. Consequently this change
must remain a review branch until actual browser QA is completed.

Before publishing, check at 375px and 390px widths and on a real iPhone:

1. Open a building, close it before address loading finishes, select another:
   no old address, score, brief or history must appear on the new sheet.
2. Move the phone while the sheet is open: save/observation still concern the
   displayed target. Close and verify targeting resumes.
3. Check a building-linked address, nearby-address fallback, slow network and
   unavailable cloud, both signed in and signed out.
4. Confirm readable text, no horizontal overflow, accessible close/action buttons,
   Escape/Tab behavior, background disabled while dialog open, and scroll reset.
5. Verify existing installed PWA loads the updated shell and assets.
6. Field-test GPS/orientation and identification on several actual buildings.

No claim of field validation, complete product readiness or validated predictions.
