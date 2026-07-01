#!/usr/bin/env node
// SessionStart hook: emit a compact "you launched from X" pointer for any
// Claude Code session whose cwd is under ~/code/work/. The four axis INDEX.md
// files are already @-loaded by ~/code/work/CLAUDE.md ... this hook adds the
// cwd-specific lens, not the topology itself.
//
// Input:  JSON on stdin from Claude Code (fields: cwd, session_id, source).
// Output: JSON on stdout per Claude Code's SessionStart contract.
// Failure mode: silent. Any throw -> exit 0 with no injection.

import { readFileSync, existsSync } from 'node:fs'
import { relative } from 'node:path'
import { execSync } from 'node:child_process'

const WORK_ROOT = '/Users/nplmini/code/work'
const MAX_CHARS = 3000

function git(cwd, args) {
  return execSync(`git ${args}`, { cwd, timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim()
}

// Distinguish "session runs on the shared ~/code/work checkout" from
// "session runs in an isolated linked worktree". Root cause of the
// 2026-07-01 63-file mess: concurrent sessions on the shared checkout.
function gitStateSection(cwd) {
  try {
    const gitDir = git(cwd, 'rev-parse --git-dir')
    const commonDir = git(cwd, 'rev-parse --git-common-dir')
    const isWorktree = gitDir !== commonDir && gitDir !== '.git'
    const branch = git(cwd, 'branch --show-current') || '(detached HEAD)'
    const dirty = git(cwd, 'status --porcelain').split('\n').filter(Boolean).length
    const lines = ['', '## Git state']
    if (isWorktree) {
      lines.push('', `Isolated worktree (safe). Branch \`${branch}\`, ${dirty} uncommitted file(s), all yours.`)
      lines.push('Finish by committing on this branch and pushing; open a PR to main.')
      lines.push('Caveat: gitignored files (.env, .secrets, node_modules) are NOT here. If you need to RUN services/scripts, say so before assuming they are broken.')
    } else {
      lines.push('', `**SHARED CHECKOUT** ... this session runs directly on \`~/code/work\`, NOT an isolated worktree. Other live sessions may be editing this same tree. Branch \`${branch}\`, ${dirty} uncommitted file(s)${dirty > 0 ? ' (some may belong to OTHER sessions)' : ''}.`)
      lines.push('', 'Hard rules on the shared checkout:')
      lines.push('- If this session will edit more than a couple of files, create an isolated worktree first (EnterWorktree) unless Nick explicitly said to work in place (live-state work: launchd jobs, dist builds, .env).')
      lines.push('- New branches are cut from main explicitly: `git switch -c <name> main`. NEVER branch from the current HEAD.')
      lines.push('- Stage/commit ONLY files this session touched, by explicit path. Never blind `git add -A`. NEVER `git clean -fdx` (wipes gitignored .env/.secrets).')
      lines.push('- Do not discard or stash dirty files you did not create.')
    }
    return lines
  } catch {
    return []
  }
}

function readStdinJson() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function classifyCwd(cwd) {
  if (!cwd || typeof cwd !== 'string') return null
  if (!cwd.startsWith(WORK_ROOT)) return null
  const rel = relative(WORK_ROOT, cwd)
  if (!rel || rel === '.') return { kind: 'root' }
  const parts = rel.split('/').filter(Boolean)
  const axis = parts[0]
  if (axis === 'accounts') {
    return { kind: 'accounts', subtype: parts[1] || null, child: parts[2] || null, rel }
  }
  if (['systems', 'practices', 'capabilities'].includes(axis)) {
    return { kind: axis, child: parts[1] || null, rel }
  }
  return { kind: 'other', rel }
}

function build(input) {
  const cwd = input.cwd || process.env.PWD || ''
  const cls = classifyCwd(cwd)
  if (!cls) return null

  const lines = []
  lines.push('# Session launch context')
  lines.push('')
  if (cls.kind === 'root') {
    lines.push('Launched from the workspace root (`~/code/work/`). All four axis indexes are loaded.')
  } else if (cls.kind === 'accounts') {
    const where = `accounts/${cls.subtype || '(unknown subtype)'}` + (cls.child ? `/${cls.child}` : '')
    lines.push(`Launched from \`${where}\` (axis: accounts, subtype: ${cls.subtype || 'n/a'}).`)
    lines.push('')
    lines.push(`The engagement's own CLAUDE.md is loaded via walk-up. Sibling engagements and other axes are in the indexes loaded by the root CLAUDE.md.`)
  } else if (cls.kind === 'other') {
    lines.push(`Launched from \`${cls.rel}\` (outside the four primary axes).`)
  } else {
    const where = cls.child ? `${cls.kind}/${cls.child}` : cls.kind
    lines.push(`Launched from \`${where}\` (axis: ${cls.kind}).`)
    lines.push('')
    lines.push(`This folder's own CLAUDE.md is loaded via walk-up. Sibling axes (systems, practices, accounts, capabilities) are indexed in the four INDEX.md files loaded by the root CLAUDE.md ... use them before assuming a sibling is absent.`)
  }
  lines.push('')
  lines.push('Indexes regenerate via `node scripts/generate-indexes.mjs`. Run after any folder add or rename.')
  lines.push(...gitStateSection(cwd))
  let out = lines.join('\n')
  if (out.length > MAX_CHARS) out = out.slice(0, MAX_CHARS - 60) + '\n\n...(truncated to fit injection cap)'
  return out
}

try {
  const input = readStdinJson()
  const ctx = build(input)
  if (ctx) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: ctx,
      },
    }))
  }
} catch {
  // Silent fail: hook must never break session bootstrap.
}
process.exit(0)
