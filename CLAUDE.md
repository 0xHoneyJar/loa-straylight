@.claude/loa/CLAUDE.loa.md

# Project-Specific Instructions

> This file contains project-specific customizations that take precedence over the framework instructions.
> The framework instructions are loaded via the `@` import above.

## Project Configuration

Add your project-specific Claude Code instructions here.

## Straylight Control Plane (ADR-050)

When acting as the control-plane **implementer**, follow the permanent
prompt at `.straylight/prompts/claude-fable-implementer.md` and the
protocol at `.straylight/README.md`. Non-negotiables: reconstruct state
from GitHub (local disk is a cache); act only on a lane in
`ready-for-claude`; acquire a valid lease first; require a valid task
packet bound to the lane's exact base SHA; never audit yourself; never
merge; never choose a new semantic lane; stop on authority uncertainty.
`operator:eileen` is the sole Straylight authority (ADR-049 §6).
Kill switch: `.straylight/automation-policy.json` → `"enabled": false`.
