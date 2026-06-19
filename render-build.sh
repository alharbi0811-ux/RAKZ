#!/bin/bash
set -e

echo "==> Installing dependencies with npm..."
npm install --prefix artifacts/api-server --legacy-peer-deps

echo "==> Installing workspace libs..."
npm install --prefix lib/db --legacy-peer-deps 2>/dev/null || true
npm install --prefix lib/api-zod --legacy-peer-deps 2>/dev/null || true

echo "==> Building..."
cd artifacts/api-server && node build.mjs
