#!/usr/bin/env bash
# Puts your Anthropic API key on the server and turns the AI tutor on.
# The key is typed here, hidden, and goes straight to the server over SSH: it never shows on screen,
# never lands in your shell history, and never has to be pasted into a chat.
#
#   bash scripts/set-ai-key.sh
#
# It also sets the model (default claude-sonnet-5-5, quick and inexpensive for short tutoring answers;
# run  ANTHROPIC_MODEL=claude-opus-5-5 bash scripts/set-ai-key.sh  for the strongest one).
# Before you run it: create the key at console.anthropic.com and set a monthly spend limit there.
set -euo pipefail

HOST="${SMART_SCHOOLS_HOST:-root@163.245.192.206}"
MODEL="${ANTHROPIC_MODEL:-claude-sonnet-5-5}"

read -rsp "Paste your Anthropic API key (nothing shows while you type), then press Enter: " KEY
echo
if [[ "$KEY" != sk-ant-* ]]; then
  echo "That does not look like an Anthropic key (they start with sk-ant-). Nothing was changed."
  exit 1
fi

printf 'ANTHROPIC_API_KEY=%s\nANTHROPIC_MODEL=%s\n' "$KEY" "$MODEL" | ssh "$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
cd /opt/smart-schools
NEW="$(cat)"
sed -i '/^ANTHROPIC_API_KEY=/d;/^ANTHROPIC_MODEL=/d' .env
printf '%s\n' "$NEW" >> .env
chown smartschools:smartschools .env
chmod 600 .env
systemctl restart smart-schools
sleep 4
systemctl is-active smart-schools
journalctl -u smart-schools -n 20 --no-pager | grep -E "AI tutor|AI questions" | sed -E 's/^.*node\[[0-9]+\]: //'
REMOTE
unset KEY
echo "Done. Open the bot and ask it a real question, for example: why do we flip the sign when we move a number across the equals sign?"
