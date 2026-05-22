# DormVibe — Skills Install Guide

Manual install of Tier 1 + Tier 2 skills for use with Claude Code CLI. Use this when `/plugin install` is unavailable or when you want explicit control over which skills land on disk.

---

## Skill list

### Tier 1 — Strongly recommended for Phase 3

| Skill | Source repo | Path inside repo |
|---|---|---|
| test-driven-development | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/test-driven-development`](https://github.com/obra/superpowers/tree/main/skills/test-driven-development) |
| systematic-debugging | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/systematic-debugging`](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) |
| verification-before-completion | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/verification-before-completion`](https://github.com/obra/superpowers/tree/main/skills/verification-before-completion) |
| writing-plans | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/writing-plans`](https://github.com/obra/superpowers/tree/main/skills/writing-plans) |
| executing-plans | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/executing-plans`](https://github.com/obra/superpowers/tree/main/skills/executing-plans) |
| webapp-testing | [anthropics/skills](https://github.com/anthropics/skills) | [`skills/webapp-testing`](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) |

### Tier 2 — Useful, lower priority

| Skill | Source repo | Path inside repo |
|---|---|---|
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills) | [`skills/frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design) |
| web-artifacts-builder | [anthropics/skills](https://github.com/anthropics/skills) | [`skills/web-artifacts-builder`](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder) |
| requesting-code-review | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/requesting-code-review`](https://github.com/obra/superpowers/tree/main/skills/requesting-code-review) |
| receiving-code-review | [obra/superpowers](https://github.com/obra/superpowers) | [`skills/receiving-code-review`](https://github.com/obra/superpowers/tree/main/skills/receiving-code-review) |

---

## Where skills live

Claude Code looks for skills in two places:

- **User-level** (available in every project): `C:\Users\Anson Lee\.claude\skills\`
- **Project-level** (this repo only, committable): `C:\Users\Anson Lee\Documents\trae_projects\DormVibe\.claude\skills\`

For these general-purpose engineering skills, install at **user-level** — you'll want them in every project, not just DormVibe.

Each skill is a folder containing a `SKILL.md` file (plus optional scripts/assets). The folder name is the skill name. Final layout should look like:

```
C:\Users\Anson Lee\.claude\skills\
├── test-driven-development\
│   └── SKILL.md
├── systematic-debugging\
│   └── SKILL.md
├── webapp-testing\
│   └── SKILL.md
└── ...
```

---

## Install — recommended method (sparse clone)

Cloning each full repo wastes space. Sparse-checkout pulls only the skill folders you want.

### One-time setup

```powershell
cd "$env:USERPROFILE\.claude"
mkdir skills -Force
cd skills
```

### Pull the obra/superpowers skills

```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/obra/superpowers.git _superpowers
cd _superpowers
git sparse-checkout set `
  skills/test-driven-development `
  skills/systematic-debugging `
  skills/verification-before-completion `
  skills/writing-plans `
  skills/executing-plans `
  skills/requesting-code-review `
  skills/receiving-code-review
cd ..
```

Move the skill folders up so they sit directly under `.claude\skills\`:

```powershell
Move-Item _superpowers\skills\* . -Force
Remove-Item _superpowers -Recurse -Force
```

### Pull the anthropics/skills skills

```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/anthropics/skills.git _anthropic
cd _anthropic
git sparse-checkout set `
  skills/webapp-testing `
  skills/frontend-design `
  skills/web-artifacts-builder
cd ..
Move-Item _anthropic\skills\* . -Force
Remove-Item _anthropic -Recurse -Force
```

### Verify

```powershell
ls "$env:USERPROFILE\.claude\skills"
```

You should see 10 folders, each containing a `SKILL.md`.

---

## Install — alternative (manual download)

If you'd rather not use git:

1. Open each skill folder link from the tables above in your browser.
2. Use a tool like [download-directory.github.io](https://download-directory.github.io/) — paste the folder URL, it gives you a zip.
3. Extract the zip into `C:\Users\Anson Lee\.claude\skills\<skill-name>\`.
4. Confirm a `SKILL.md` sits at the top level of each folder.

---

## Verifying skills are loaded

Start a Claude Code session (`claude` in a terminal) inside this repo. At the prompt:

```
/skills
```

You should see all 10 new skills listed alongside the existing built-ins. If a skill is missing, check that its folder is directly under `.claude\skills\` (not nested an extra level deep) and contains a `SKILL.md` with valid frontmatter.

---

## Updating later

Re-run the sparse clone steps above whenever you want fresh versions. Or `cd` into each skill folder, `git pull` if you kept it as a checkout. Skills are just files — there's no install database to worry about.

---

## Removing a skill

Delete its folder. That's it.

```powershell
Remove-Item "$env:USERPROFILE\.claude\skills\<skill-name>" -Recurse -Force
```

---

## Notes

- The `superpowers` repo includes other skills (brainstorming, using-git-worktrees, dispatching-parallel-agents, etc.) that come bundled if you do the full plugin install. With sparse-checkout you're cherry-picking — add more from the [obra/superpowers skills list](https://github.com/obra/superpowers/tree/main/skills) anytime by extending the `sparse-checkout set` line.
- These are general engineering skills, not DormVibe-specific. Keep them user-level. The only reason to install at project-level is if you want them committed to the repo so collaborators get them automatically — which is a real option, but read the skills' licenses first.
- Skill frontmatter (`description:` in SKILL.md) controls when Claude auto-loads them. Don't edit it unless you know what you're doing.
