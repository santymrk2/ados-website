#!/usr/bin/env bash
# Fails while activity screens still use classes designed for the old blue background.
set -euo pipefail
cd "$(dirname "$0")/.."

TARGETS=(src/app/activities src/components/auth/AuthGate.tsx)
# White-translucent utilities that sit on team-tinted cards in ExtrasSection, not on the page
ALLOW='hover:bg-white/60 hover:rounded|bg-white/50 hover:bg-white/80'
fail=0

# 1. Translucent white utilities only make sense on a colored page background
if matches=$(rg -n --glob '*.tsx' -e 'bg-white/[0-9]+' -e 'border-white' -e 'text-white/[0-9]+' -e 'hover:bg-white/[0-9]+' "${TARGETS[@]}" | rg -v -e "$ALLOW"); then
  echo "Clases para fondo azul que quedan:"; echo "$matches"; fail=1
fi

# 2. Plain text-white is only valid on an element whose own background is bg-primary
if matches=$(rg -n --glob '*.tsx' -w 'text-white' "${TARGETS[@]}" | rg -v 'bg-primary'); then
  echo "text-white fuera de un elemento bg-primary:"; echo "$matches"; fail=1
fi

# 3. The activity page background must be light (both searches must come back empty)
matches=$( { rg -n -e 'isActivityDetailPage \? "bg-primary"' src/components/auth/AuthGate.tsx; rg -n -e 'min-h-screen bg-primary' -e 'pt-safe bg-primary' -e '"bg-primary px-4' src/app/activities; } || true )
if [ -n "$matches" ]; then
  echo "Fondo azul de pagina:"; echo "$matches"; fail=1
fi

if [ "$fail" -eq 0 ]; then echo "OK: actividades sin clases del fondo azul"; else exit 1; fi
