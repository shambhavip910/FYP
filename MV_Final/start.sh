#!/usr/bin/env bash
# Start Flask optimizer (ML + NSGA-II) on :5000
set -e
cd "$(dirname "$0")"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv --without-pip .venv
  curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
  .venv/bin/python /tmp/get-pip.py
  .venv/bin/pip install -r requirements.txt
fi
exec .venv/bin/python app.py
