#!/usr/bin/env bash
set -euo pipefail

if [ "$(uname -s)" != "Linux" ]; then
  exit 0
fi

if ! command -v ldconfig >/dev/null 2>&1; then
  echo "==> Could not run Linux desktop prereq check (ldconfig not found)."
  echo "==> If Electron fails to start, install common runtime libs (gtk3, nss, asound, xss, xtst, at-spi2, libsecret, libnotify, cups, gbm)."
  exit 0
fi

declare -a missing_packages=()

require_lib() {
  local so_name="$1"
  local package_hint="$2"
  if ! ldconfig -p 2>/dev/null | grep -Fq "$so_name"; then
    missing_packages+=("$package_hint")
  fi
}

# Common Electron runtime requirements on Linux.
require_lib "libgtk-3.so.0" "libgtk-3-0"
require_lib "libnss3.so" "libnss3"
require_lib "libasound.so.2" "libasound2"
require_lib "libXss.so.1" "libxss1"
require_lib "libXtst.so.6" "libxtst6"
require_lib "libatspi.so.0" "libatspi2.0-0"
require_lib "libsecret-1.so.0" "libsecret-1-0"
require_lib "libnotify.so.4" "libnotify4"
require_lib "libcups.so.2" "libcups2"
require_lib "libgbm.so.1" "libgbm1"

if [ "${#missing_packages[@]}" -gt 0 ]; then
  # Unique package names while preserving order.
  declare -A seen=()
  declare -a unique=()
  for pkg in "${missing_packages[@]}"; do
    if [ -z "${seen[$pkg]+x}" ]; then
      seen[$pkg]=1
      unique+=("$pkg")
    fi
  done

  echo "==> Missing Linux desktop runtime libraries for Electron:"
  for pkg in "${unique[@]}"; do
    echo "    - $pkg"
  done

  if command -v apt-get >/dev/null 2>&1; then
    echo "==> Install (Debian/Ubuntu):"
    echo "    sudo apt-get update && sudo apt-get install -y ${unique[*]}"
  elif command -v dnf >/dev/null 2>&1; then
    echo "==> Install (Fedora/RHEL):"
    echo "    sudo dnf install -y gtk3 nss alsa-lib libXScrnSaver libXtst at-spi2-core libsecret libnotify cups-libs mesa-libgbm"
  elif command -v yum >/dev/null 2>&1; then
    echo "==> Install (RHEL/CentOS):"
    echo "    sudo yum install -y gtk3 nss alsa-lib libXScrnSaver libXtst at-spi2-core libsecret libnotify cups-libs mesa-libgbm"
  fi

  exit 1
fi

# AppImage-specific prerequisites are warnings here (desktop dev mode does not require AppImage).
if ! ldconfig -p 2>/dev/null | grep -Fq "libfuse.so.2"; then
  echo "==> Warning: libfuse2 (libfuse.so.2) is not installed."
  echo "==> Open Sprint AppImage may not start until FUSE2 is installed."
fi

if [ -r /proc/sys/kernel/unprivileged_userns_clone ]; then
  if [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo 1)" = "0" ]; then
    echo "==> Warning: unprivileged user namespaces are disabled."
    echo "==> Some Electron AppImage sandbox configurations can fail on this host."
  fi
fi
