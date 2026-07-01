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

const WORK_ROOT = '/Users/nplmini/code/work'
const MAX_CHARS = 1800

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
