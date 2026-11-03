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
- [ ] Editing an input hides stale results until Compare runs again.
- [ ] Refresh returns to empty forms and no preview.
- [ ] Storage contains no application offer entries, and network requests carry no offer details.
- [ ] Loading examples uses fictional JSON; a failed fetch leaves manual entry working.
- [ ] Markup entered as company/role is displayed literally, never executed.

## Pages and automation

- [ ] Select GitHub Actions as the Pages source, run deployment, and verify the real published URL.
- [ ] Run Update fictional example JSON with valid fictional data; verify the commit and optional deployment.
- [ ] Invalid JSON produces no commit.
- [ ] Repeating identical JSON produces no extra commit.

Automated local checks supplement these checks. They do not establish team approval, successful teammate setup, GitHub-hosted workflow success, or full assistive-technology compatibility.
