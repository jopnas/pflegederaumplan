#!/bin/sh
export GH_TOKEN="78a5230763e5bc9f5cd99bf9a1d14d9962a57395"
if [ -z "$GH_TOKEN" ]; then
    echo "You must set the GH_TOKEN environment variable."
    echo "See README.md for more details."
    exit 1
fi

# This will build, package and upload the app to GitHub.
node_modules/.bin/build --win --mac -p always
