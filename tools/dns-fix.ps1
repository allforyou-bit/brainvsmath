# ============================================================
# dns-fix.ps1 - fully automated Porkbun DNS management for
# brainvsmath.com via the official Porkbun API.
#
# SETUP (one time): create the file  .claude\porkbun-api.env
# next to the repo root with exactly two lines:
#   PORKBUN_API_KEY=pk1_xxxxxxxxxxxxxxxx
#   PORKBUN_SECRET_KEY=sk1_xxxxxxxxxxxxxxxx
# (Keys: porkbun.com/account/api. The file is git-ignored and the
#  secret never appears in chat transcripts or the repository.)
# Per-domain API access must be ON, or "Opt In All Domains" checked.
#
# RUN:  powershell -ExecutionPolicy Bypass -File tools\dns-fix.ps1
# Idempotent: safe to re-run; it converges the zone to the target.
# ============================================================
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".claude\porkbun-api.env"
if (-not (Test-Path $envFile)) {
  Write-Output "MISSING: $envFile"
  Write-Output "Create it with PORKBUN_API_KEY= and PORKBUN_SECRET_KEY= lines (see header)."
  exit 2
}
$kv = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^\s*([A-Z_]+)\s*=\s*(.+?)\s*$") { $kv[$Matches[1]] = $Matches[2] }
}
if (-not $kv["PORKBUN_API_KEY"] -or -not $kv["PORKBUN_SECRET_KEY"]) {
  Write-Output "env file present but keys missing"; exit 2
}

$domain = "brainvsmath.com"
$base = "https://api.porkbun.com/api/json/v3"
$auth = @{ apikey = $kv["PORKBUN_API_KEY"]; secretapikey = $kv["PORKBUN_SECRET_KEY"] }

function Invoke-Porkbun($path, $extra) {
  $body = @{}
  $auth.GetEnumerator() | ForEach-Object { $body[$_.Key] = $_.Value }
  if ($extra) { $extra.GetEnumerator() | ForEach-Object { $body[$_.Key] = $_.Value } }
  $json = $body | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri "$base$path" -Body $json -ContentType "application/json" -TimeoutSec 30
}

Write-Output "== auth ping =="
$ping = Invoke-Porkbun "/ping" $null
Write-Output ("status: " + $ping.status + "  yourIp: " + $ping.yourIp)

Write-Output "== retrieve current records =="
$cur = Invoke-Porkbun "/dns/retrieve/$domain" $null
$cur.records | ForEach-Object { Write-Output ("  [" + $_.id + "] " + $_.type + " " + $_.name + " -> " + $_.content) }

# --- 1) delete parking records (uixie) ---
$parking = $cur.records | Where-Object { $_.content -match "uixie|pixie" }
foreach ($rec in $parking) {
  Write-Output ("deleting parking record " + $rec.id + " (" + $rec.type + " " + $rec.name + " -> " + $rec.content + ")")
  Invoke-Porkbun "/dns/delete/$domain/$($rec.id)" $null | Out-Null
}

# --- 2) ensure GitHub Pages records exist ---
$want = @(
  @{ type = "A";     name = "";    content = "185.199.108.153" },
  @{ type = "A";     name = "";    content = "185.199.109.153" },
  @{ type = "A";     name = "";    content = "185.199.110.153" },
  @{ type = "A";     name = "";    content = "185.199.111.153" },
  @{ type = "CNAME"; name = "www"; content = "allforyou-bit.github.io" }
)
$cur2 = Invoke-Porkbun "/dns/retrieve/$domain" $null
foreach ($w in $want) {
  $fqdn = if ($w.name) { $w.name + "." + $domain } else { $domain }
  $exists = $cur2.records | Where-Object { $_.type -eq $w.type -and $_.name -eq $fqdn -and $_.content -eq $w.content }
  if ($exists) { Write-Output ("exists: " + $w.type + " " + $fqdn + " -> " + $w.content) }
  else {
    Write-Output ("creating: " + $w.type + " " + $fqdn + " -> " + $w.content)
    Invoke-Porkbun "/dns/create/$domain" @{ type = $w.type; name = $w.name; content = $w.content; ttl = "600" } | Out-Null
  }
}

# --- 3) verify final zone ---
Write-Output "== final zone =="
$fin = Invoke-Porkbun "/dns/retrieve/$domain" $null
$fin.records | ForEach-Object { Write-Output ("  " + $_.type + " " + $_.name + " -> " + $_.content) }

Write-Output "== authoritative check =="
try {
  $a = Resolve-DnsName $domain -Type A -Server maceio.ns.porkbun.com -ErrorAction Stop
  $a | ForEach-Object { Write-Output ("  A " + $_.IPAddress) }
} catch { Write-Output ("  resolve err: " + $_.Exception.Message) }

Write-Output ""
Write-Output "NEXT (Claude runs these): gh api -X PUT repos/allforyou-bit/brainvsmath/pages -f cname=$domain ; verify https://$domain ; enforce HTTPS after cert."
