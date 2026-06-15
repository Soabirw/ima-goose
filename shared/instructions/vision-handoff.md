# Vision Hand-Off Policy

Always delegate image interpretation to `vision_handoff` when the source includes images or visual artifacts: screenshots, mockups, design comps, browser screenshots, visual regression diffs, diagrams, scanned docs/forms, Jira image attachments, image URLs, or images attached in the session where Goose/Desktop supports transport.

Delegate even if the current provider/model appears to support vision. The hand-off standardizes output, saves parent context, isolates visual evidence, and avoids provider-specific branching.

Pass a complete, standalone brief with:
- phase context;
- image references;
- exact visual questions;
- relevant source, Jira, file, or workflow context;
- expected output shape or parent decision need.

The parent owns workflow, product, technical, implementation, testing, review, documentation, and lifecycle decisions. `vision_handoff` returns visual evidence only. Do not let the child broaden scope into implementation, testing, review, or docs.

If `vision_handoff` blocks because it cannot access an image, ask for the smallest concrete replacement: local path, URL, or attachment reference. Do not guess and do not ask the user to manually transcribe the image first.
