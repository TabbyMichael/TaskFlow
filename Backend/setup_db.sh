#!/usr/bin/env bash
set -euo pipefail

# Directory paths
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
DB_DIR="$DIR/postgres_data"
PORT=5433
PG_BIN="/usr/lib/postgresql/18/bin"

echo "=== TaskFlow Isolated Database Setup ==="
echo "Database Directory: $DB_DIR"
echo "Port: $PORT"

# Ensure data directory exists and is initialized
if [ ! -d "$DB_DIR" ]; then
    echo "Initializing database cluster..."
    "$PG_BIN/initdb" -D "$DB_DIR" -U postgres --auth-local=trust --auth-host=trust
else
    echo "Database cluster already initialized."
fi

# Check if postgres is already running on port 5433
if "$PG_BIN/pg_isready" -p $PORT -h localhost >/dev/null 2>&1; then
    echo "PostgreSQL is already running on port $PORT."
else
    echo "Starting PostgreSQL on port $PORT..."
    "$PG_BIN/pg_ctl" -D "$DB_DIR" -o "-p $PORT -k $DB_DIR" -l "$DB_DIR/postgresql.log" start
    sleep 2
fi

# Check if taskforge_db database exists, if not create it
echo "Checking database 'taskforge_db'..."
if "$PG_BIN/psql" -h localhost -p $PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw taskforge_db; then
    echo "Database 'taskforge_db' already exists."
else
    echo "Creating database 'taskforge_db'..."
    "$PG_BIN/createdb" -h localhost -p $PORT -U postgres taskforge_db
    echo "Database 'taskforge_db' created successfully."
fi

echo "Database status check:"
"$PG_BIN/pg_isready" -p $PORT -h localhost
echo "========================================="
