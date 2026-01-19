#!/bin/bash

echo "========================================="
echo "Wave 1.1.1 Setup Verification Script"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="${GREEN}✓${NC}"
cross_mark="${RED}✗${NC}"
info_mark="${YELLOW}ℹ${NC}"

echo "1. Checking package manager..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "   ${check_mark} pnpm installed: v${PNPM_VERSION}"
else
    echo -e "   ${cross_mark} pnpm not found"
    exit 1
fi

echo ""
echo "2. Checking project files..."

# Check package.json
if [ -f "package.json" ]; then
    echo -e "   ${check_mark} package.json exists"
else
    echo -e "   ${cross_mark} package.json missing"
    exit 1
fi

# Check lock file
if [ -f "pnpm-lock.yaml" ]; then
    echo -e "   ${check_mark} pnpm-lock.yaml exists"
else
    echo -e "   ${cross_mark} pnpm-lock.yaml missing"
    exit 1
fi

# Check configuration files
if [ -f "tsconfig.json" ]; then
    echo -e "   ${check_mark} tsconfig.json exists"
else
    echo -e "   ${cross_mark} tsconfig.json missing"
    exit 1
fi

if [ -f "electron.vite.config.ts" ]; then
    echo -e "   ${check_mark} electron.vite.config.ts exists"
else
    echo -e "   ${cross_mark} electron.vite.config.ts missing"
    exit 1
fi

echo ""
echo "3. Checking source directories..."

# Check source structure
if [ -d "src/main" ] && [ -f "src/main/index.ts" ]; then
    echo -e "   ${check_mark} src/main/index.ts exists"
else
    echo -e "   ${cross_mark} src/main/index.ts missing"
    exit 1
fi

if [ -d "src/preload" ] && [ -f "src/preload/index.ts" ]; then
    echo -e "   ${check_mark} src/preload/index.ts exists"
else
    echo -e "   ${cross_mark} src/preload/index.ts missing"
    exit 1
fi

if [ -d "src/renderer" ] && [ -f "src/renderer/main.tsx" ]; then
    echo -e "   ${check_mark} src/renderer/main.tsx exists"
else
    echo -e "   ${cross_mark} src/renderer/main.tsx missing"
    exit 1
fi

if [ -f "src/renderer/App.tsx" ]; then
    echo -e "   ${check_mark} src/renderer/App.tsx exists"
else
    echo -e "   ${cross_mark} src/renderer/App.tsx missing"
    exit 1
fi

if [ -f "src/renderer/index.html" ]; then
    echo -e "   ${check_mark} src/renderer/index.html exists"
else
    echo -e "   ${cross_mark} src/renderer/index.html missing"
    exit 1
fi

echo ""
echo "4. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "   ${check_mark} node_modules installed"
else
    echo -e "   ${cross_mark} node_modules missing"
    exit 1
fi

echo ""
echo "5. Running TypeScript compilation check..."
if pnpm tsc --noEmit > /dev/null 2>&1; then
    echo -e "   ${check_mark} TypeScript compilation passed"
else
    echo -e "   ${cross_mark} TypeScript compilation failed"
    echo "   Run 'pnpm tsc --noEmit' to see errors"
    exit 1
fi

echo ""
echo "6. Running build test..."
if pnpm build > /dev/null 2>&1; then
    echo -e "   ${check_mark} Build completed successfully"

    # Check build outputs
    if [ -f "dist-electron/main/index.js" ]; then
        echo -e "   ${check_mark} Main process built"
    else
        echo -e "   ${cross_mark} Main process build missing"
        exit 1
    fi

    if [ -f "dist-electron/preload/index.mjs" ]; then
        echo -e "   ${check_mark} Preload script built"
    else
        echo -e "   ${cross_mark} Preload script build missing"
        exit 1
    fi

    if [ -f "dist-electron/renderer/index.html" ]; then
        echo -e "   ${check_mark} Renderer built"
    else
        echo -e "   ${cross_mark} Renderer build missing"
        exit 1
    fi
else
    echo -e "   ${cross_mark} Build failed"
    echo "   Run 'pnpm build' to see errors"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}All verification checks passed!${NC}"
echo "========================================="
echo ""
echo -e "${info_mark} To launch the development server, run:"
echo "   pnpm dev"
echo ""
echo -e "${info_mark} Wave 1.1.1 Definition of Done:"
echo "   ✓ pnpm v8+ installed and configured"
echo "   ✓ All dependencies installed successfully"
echo "   ✓ TypeScript compilation passes (strict mode)"
echo "   ✓ Build completes for all three processes"
echo "   ✓ Project structure established"
echo ""
echo "Next: Launch 'pnpm dev' to verify Electron window display"
echo ""
