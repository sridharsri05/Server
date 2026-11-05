# Postmortem: API down on Vercel (Node 26 runtime), 2026-11-05

Blameless. The goal is to fix the process, not to assign fault.

## Summary
The whole API returned `FUNCTION_INVOCATION_FAILED` on Vercel.

## Impact
All routes were down, including Google sign-in, for roughly the period from the push until the fix was deployed.

## Root cause
The Vercel runtime was `nodejs26.x`. The dependency chain `jsonwebtoken` -> `jws` -> `jwa` -> `buffer-equal-constant-time` reads `SlowBuffer.prototype` at load time. `SlowBuffer` was removed in Node 26, so the function crashed on import.

## Detection
The user noticed failed sign-in. The Vercel runtime logs then showed the stack trace.

## Fix
Commit `3c52a41` pinned `engines.node` to `22.x`.

## Contributing factors
- No CI boot check, so a crash-on-import was not caught before deploy.
- No uptime monitoring, so detection depended on a user.
- An older unpushed local commit (`bba6020`) went out in the same push, widening what changed.

## Follow-ups
- [x] CI boot check on Node 22, plus a non-blocking Node 26 check (`.github/workflows/ci.yml`).
- [ ] Uptime monitor on `GET /`.
- [ ] Keep local and deploy Node versions in sync via `engines` and `.nvmrc`.
