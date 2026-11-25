# Human acceptance review

Use `npm start`. Test at 375 px and 1280 px. Record reviewer/date/results in Jira or a PR rather than checking these off without evidence.

## JOC-44 team verification still required

- [ ] Team approves the model and module contract in architecture.md.
- [ ] A second teammate follows README clone/run steps on their computer.

## JOC-12 / JOC-13 / JOC-14 / JOC-15

- [ ] Two clearly distinguished forms show company/offer name, role, and USD per year.
- [ ] All inputs have associated labels, helpful units, and visible keyboard focus.
- [ ] Both 375 px and 1280 px layouts are usable without horizontal overflow.
- [ ] Typing in Offer A does not change Offer B; the reverse also works.
- [ ] Compare works with mouse and with keyboard (including Enter from an input).
- [ ] Missing/whitespace labels and missing, negative, or nonnumeric salary block the preview.
- [ ] Invalid input remains present and editable; summary links focus the correct field.
- [ ] Explicit zero salary and two-decimal salaries are accepted.
- [ ] Two valid offers appear in the preview with the latest values.
- [ ] Each offer's annual base salary is prominent near the top, labeled with its company/offer, and formatted consistently as USD per year; bonus and equity are not included.
- [ ] Corresponding offer fields align side by side on desktop and remain grouped with Offer A/Offer B labels on mobile.
- [ ] The annual salary difference is correct for either offer paying more, and equal salaries are identified as equal.
- [ ] The comparison describes salary only and does not declare an overall winning offer.
- [ ] Edit Offer A and Edit Offer B each focus the selected offer with all current fields intact; the other offer remains unchanged.
- [ ] Editing a value hides the stale comparison; submitting revalidates both offers, recomputes the difference, and refreshes the comparison.
- [ ] Reset Both Offers clears every form field, both in-memory records, errors, and prior comparison.
- [ ] Record the browser/device and ten consecutive edit-submit elapsed times; each updated result appears in under 1,000 ms.
- [ ] The salary summary remains readable without horizontal overflow at both 375 px and 1280 px.
- [ ] Editing an input hides stale results until Compare runs again.
- [ ] Refresh returns to empty forms and no preview.
- [ ] Storage contains no application offer entries, and network requests carry no offer details.
- [ ] Loading examples uses fictional JSON; a failed fetch leaves manual entry working.
- [ ] Markup entered as company/role is displayed literally, never executed.

For the ten timing checks, start a timer immediately before submitting a corrected offer and stop when the updated comparison is visible. Record all ten results in the PR or Jira along with browser, device, and viewport; do not infer timing from an automated unit test.

## Pages and automation

- [ ] Select GitHub Actions as the Pages source, run deployment, and verify the real published URL.
- [ ] Run Update fictional example JSON with valid fictional data; verify the commit and optional deployment.
- [ ] Invalid JSON produces no commit.
- [ ] Repeating identical JSON produces no extra commit.

Automated local checks supplement these checks. They do not establish team approval, successful teammate setup, GitHub-hosted workflow success, or full assistive-technology compatibility.
