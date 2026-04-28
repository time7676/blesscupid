#!/usr/bin/env bash
# Build mobile app for TestFlight (iOS) and internal track (Android) via EAS.
#
# Usage:
#   ./scripts/build-mobile.sh                 # default: profile=production, both platforms
#   PROFILE=preview ./scripts/build-mobile.sh
#   PLATFORM=ios ./scripts/build-mobile.sh
#
# Requires:
#   - EAS CLI on PATH (`pnpm dlx eas-cli@latest --version`)
#   - EXPO_TOKEN in env (Expo account access token), or `eas login` already run
#   - Apple Developer + Play Console credentials configured in EAS

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile"

PROFILE="${PROFILE:-production}"
PLATFORM="${PLATFORM:-all}"
SUBMIT="${SUBMIT:-1}"

echo "[mobile-build] profile=$PROFILE platform=$PLATFORM submit=$SUBMIT"

if ! command -v eas >/dev/null 2>&1; then
  echo "[mobile-build] eas CLI not found. Run: pnpm add -g eas-cli"
  exit 1
fi

eas build --profile "$PROFILE" --platform "$PLATFORM" --non-interactive

if [ "$SUBMIT" = "1" ] && [ "$PROFILE" = "production" ]; then
  echo "[mobile-build] submitting latest build to stores"
  eas submit --profile production --platform "$PLATFORM" --non-interactive --latest
fi
