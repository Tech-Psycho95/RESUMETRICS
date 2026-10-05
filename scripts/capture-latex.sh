#!/usr/bin/env bash
# Screenshots tests/latex-templates.html for each LaTeX clone with headless Edge (dev server must run).
# Usage: scripts/capture-latex.sh <out-dir> [id ...] [-- extra query]
out=$1; shift
edge="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ids=${*:-minimal-academic libre-cv simple-hipster keywords-cv elegant-resume developer-cv}
for id in $ids; do
  "$edge" --headless=new --disable-gpu --hide-scrollbars --window-size=1700,1250 --virtual-time-budget=6000 --screenshot="$out/$id.png" "http://localhost:5173/tests/latex-templates.html?t=$id${QUERY:+&$QUERY}" >/dev/null 2>&1
  echo "$out/$id.png"
done
