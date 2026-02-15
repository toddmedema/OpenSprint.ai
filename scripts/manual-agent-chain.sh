#!/usr/bin/env bash
# Agent Chain: Complete one bd task, commit, then kick off the next agent.
# Run: ./scripts/agent-chain.sh
# Requires: Cursor CLI (agent) - install: curl https://cursor.com/install -fsSL | bash
# Output: stream-json for real-time progress (tool calls, messages). Pipe through jq for readability.

set -e
cd "$(dirname "$0")/.."

NEXT_TASK=$(bd list --status open --json --sort priority 2>/dev/null | jq -r 'if type == "array" and length > 0 then .[0] else empty end' 2>/dev/null)

if [[ -z "$NEXT_TASK" || "$NEXT_TASK" == "null" ]]; then
  echo "✅ No open bd tasks. Agent chain complete."
  exit 0
fi

TASK_ID=$(echo "$NEXT_TASK" | jq -r '.id')
TASK_TITLE=$(echo "$NEXT_TASK" | jq -r '.title')
TASK_DESC=$(echo "$NEXT_TASK" | jq -r '.description // ""')
TASK_PRIORITY=$(echo "$NEXT_TASK" | jq -r '.priority // 2')

echo "📋 Next task: $TASK_ID - $TASK_TITLE"
echo ""

# Mark in progress
bd update "$TASK_ID" --status in_progress 2>/dev/null || true

PROMPT="Complete exactly ONE bd task and nothing else.

TASK ID: $TASK_ID
TITLE: $TASK_TITLE
DESCRIPTION: $TASK_DESC

Follow AGENTS.md. Do this task only. When done:
1. bd update $TASK_ID --status done
2. git add -A && git commit -m \"Complete $TASK_ID: $TASK_TITLE\"
3. bd sync
4. git pull --rebase && git push
5. Run: ./scripts/agent-chain.sh

If ./scripts/agent-chain.sh reports no more open tasks, you are done. Otherwise it will start the next agent."

if command -v agent &>/dev/null; then
  echo "🤖 Starting agent for $TASK_ID..."
  agent -p --force --output-format stream-json "$PROMPT"
  # Agent runs ./scripts/agent-chain.sh when done to continue the chain
else
  echo "⚠️  Cursor CLI (agent) not installed. Install with:"
  echo "   curl https://cursor.com/install -fsSL | bash"
  echo ""
  echo "Or paste this prompt into Cursor Composer to run manually:"
  echo "---"
  echo "$PROMPT"
  echo "---"
  exit 1
fi
