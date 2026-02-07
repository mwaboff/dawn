#!/bin/bash
# Creates a timestamped plan file in the .agents/plans/ directory

set -e

# Check if feature name is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <feature-name> [plan-title]"
    echo "Example: $0 user-authentication 'Add OAuth authentication'"
    exit 1
fi

FEATURE_NAME="$1"
PLAN_TITLE="${2:-plan}"

# Create timestamp in YYYYMMDDHHMMSS format
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Sanitize feature name (replace spaces and special chars with hyphens)
FEATURE_NAME=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

# Sanitize plan title for filename
PLAN_SLUG=$(echo "$PLAN_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

# Create directory
PLAN_DIR=".agents/plans/${FEATURE_NAME}"
mkdir -p "$PLAN_DIR"

# Create filename
FILENAME="${TIMESTAMP}_${PLAN_SLUG}.md"
FILEPATH="${PLAN_DIR}/${FILENAME}"

# Check if file already exists
if [ -f "$FILEPATH" ]; then
    echo "Error: File already exists: $FILEPATH"
    exit 1
fi

# Output the filepath so it can be captured
echo "$FILEPATH"
