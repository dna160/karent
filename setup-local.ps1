# ─────────────────────────────────────────────────────────────────────────────
# Karent — Local Dev Setup
# Installs PostgreSQL + Redis to D:\, wires up the DB, and starts services.
# Run once from the repo root:  .\setup-local.ps1
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'

$SCOOP_DIR   = 'D:\Scoop'
$PG_DATA     = 'D:\PostgreSQL\data'
$REDIS_DIR   = 'D:\Redis'
$DB_NAME     = 'karent'
$DB_USER     = 'karent'
$DB_PASS     = 'karent'
$DB_PORT     = 5432
$REDIS_PORT  = 6379

# ── 0. Helper ─────────────────────────────────────────────────────────────────
function Step($msg) { Write-Host "`n▸ $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }

# ── 1. Scoop ──────────────────────────────────────────────────────────────────
Step "Checking Scoop"
if (-not (Get-Command scoop -ErrorAction SilentlyContinue)) {
    Step "Installing Scoop to $SCOOP_DIR"
    $env:SCOOP = $SCOOP_DIR
    [System.Environment]::SetEnvironmentVariable('SCOOP', $SCOOP_DIR, 'User')
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
    $env:PATH = "$SCOOP_DIR\shims;$env:PATH"
    OK "Scoop installed at $SCOOP_DIR"
} else {
    $scoopPath = (Get-Command scoop).Source | Split-Path | Split-Path
    OK "Scoop already installed at $scoopPath"
}

# ── 2. PostgreSQL ─────────────────────────────────────────────────────────────
Step "Checking PostgreSQL"
if (-not (Get-Command pg_ctl -ErrorAction SilentlyContinue)) {
    Step "Installing PostgreSQL via Scoop"
    scoop bucket add main 2>$null
    scoop install postgresql
    OK "PostgreSQL installed"
} else {
    OK "PostgreSQL already installed"
}

# Locate pg binaries (Scoop shimmed or in PATH)
$pgBin = (Get-Command pg_ctl).Source | Split-Path

# Init data directory if needed
if (-not (Test-Path "$PG_DATA\PG_VERSION")) {
    Step "Initialising PostgreSQL data directory at $PG_DATA"
    New-Item -ItemType Directory -Force -Path $PG_DATA | Out-Null
    & "$pgBin\initdb" -D $PG_DATA -U postgres -E UTF8 --locale=en_US.UTF-8 -A md5 --pwprompt
    OK "Data directory initialised"
} else {
    OK "PostgreSQL data directory already exists"
}

# Start Postgres (ignore error if already running)
Step "Starting PostgreSQL"
try {
    & "$pgBin\pg_ctl" -D $PG_DATA -l "$PG_DATA\pg.log" start 2>$null
    Start-Sleep -Seconds 3
    OK "PostgreSQL started"
} catch {
    Warn "pg_ctl returned non-zero (may already be running) — continuing"
}

# Create DB user + database
Step "Creating database user '$DB_USER' and database '$DB_NAME'"
$pgEnv = @{ PGPASSWORD = 'postgres' }   # superuser password you set during initdb

$userExists = & "$pgBin\psql" -U postgres -p $DB_PORT -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>$null
if ($userExists -ne '1') {
    & "$pgBin\psql" -U postgres -p $DB_PORT -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" | Out-Null
    OK "User '$DB_USER' created"
} else {
    OK "User '$DB_USER' already exists"
}

$dbExists = & "$pgBin\psql" -U postgres -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>$null
if ($dbExists -ne '1') {
    & "$pgBin\psql" -U postgres -p $DB_PORT -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" | Out-Null
    OK "Database '$DB_NAME' created"
} else {
    OK "Database '$DB_NAME' already exists"
}

# ── 3. Redis ──────────────────────────────────────────────────────────────────
Step "Checking Redis"
if (-not (Get-Command redis-server -ErrorAction SilentlyContinue)) {
    Step "Installing Redis via Scoop"
    scoop bucket add extras 2>$null
    scoop install redis
    OK "Redis installed"
} else {
    OK "Redis already installed"
}

# Create Redis data dir and a minimal config pointing at D:\Redis
New-Item -ItemType Directory -Force -Path $REDIS_DIR | Out-Null
$redisCfg = "$REDIS_DIR\redis.conf"
if (-not (Test-Path $redisCfg)) {
    @"
port $REDIS_PORT
dir $REDIS_DIR
loglevel notice
logfile $REDIS_DIR\redis.log
save 900 1
save 300 10
"@ | Set-Content $redisCfg
    OK "Redis config written to $redisCfg"
}

# Start Redis in background if not already running
$redisRunning = $false
try { $pong = redis-cli -p $REDIS_PORT ping 2>$null; $redisRunning = ($pong -eq 'PONG') } catch {}
if (-not $redisRunning) {
    Step "Starting Redis"
    Start-Process redis-server -ArgumentList $redisCfg -WindowStyle Hidden
    Start-Sleep -Seconds 2
    OK "Redis started on port $REDIS_PORT"
} else {
    OK "Redis already running"
}

# ── 4. API deps + Prisma ──────────────────────────────────────────────────────
Step "Installing API dependencies"
Push-Location "$PSScriptRoot\apps\api"
npm install
OK "npm install done"

Step "Pushing Prisma schema to database"
node node_modules/prisma/build/index.js db push
OK "Schema pushed"

Step "Installing Playwright Chromium"
npx playwright install chromium
OK "Chromium installed"

Pop-Location

# ── 5. Dashboard deps ─────────────────────────────────────────────────────────
Step "Installing Dashboard dependencies"
Push-Location "$PSScriptRoot\apps\dashboard"
npm install
OK "npm install done"
Pop-Location

# ── 6. Summary ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  Karent local environment ready!" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "  PostgreSQL  →  localhost:$DB_PORT  /  db: $DB_NAME  /  user: $DB_USER"
Write-Host "  Redis       →  localhost:$REDIS_PORT"
Write-Host ""
Write-Host "  To start the API:" -ForegroundColor Cyan
Write-Host "    cd apps\api && node index.js"
Write-Host ""
Write-Host "  To start the Dashboard:" -ForegroundColor Cyan
Write-Host "    cd apps\dashboard && npm run dev"
Write-Host "    Then open http://localhost:3000"
Write-Host ""
Write-Host "  First run — add the Melody account via the dashboard" -ForegroundColor Yellow
Write-Host "  or: curl -X POST http://localhost:3001/api/accounts \"
Write-Host "       -H 'Content-Type: application/json' \"
Write-Host "       -d '{""slug"":""melody"",""display_name"":""Melody""}'"
Write-Host ""
