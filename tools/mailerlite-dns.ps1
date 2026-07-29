# ============================================================
# mailerlite-dns.ps1 - authenticate brainvsmath.com as a MailerLite
# sending domain, via the official Porkbun API.
#
# WHY: without these records MailerLite refuses to send from
# hello@brainvsmath.com, so the welcome automation currently sends
# from the verified hello@redsealquiz.ca (different brand).
#
# WHAT IT DOES (additive + one in-place edit, never deletes):
#   1. edits the single root SPF TXT  -> adds include:_spf.mlsend.com
#   2. creates CNAME litesrv._domainkey -> litesrv._domainkey.mlsend.com
#   3. creates TXT @ mailerlite-domain-verification=...
# A/MX/NS/_acme-challenge records are never touched. Aborts if it does
# not find exactly one SPF record. Idempotent: safe to re-run.
#
# NEEDS: .claude\porkbun-api.env  (same file dns-fix.ps1 uses)
# RUN:   powershell -ExecutionPolicy Bypass -File tools\mailerlite-dns.ps1
#
# AFTER RUNNING: wait for DNS to propagate (usually a couple of hours,
# up to 24h), then in MailerLite go to
#   Account settings > Domains > brainvsmath.com > Authenticate
# and press "Check records". Once it flips to Authenticated, change the
# welcome automation's sender email to hello@brainvsmath.com.
# ============================================================
$ErrorActionPreference = "Stop"
$D = "brainvsmath.com"
$SPF_NEW = "v=spf1 include:_spf.mlsend.com include:_spf.porkbun.com ~all"
$DKIM_NAME = "litesrv._domainkey"
$DKIM_VAL = "litesrv._domainkey.mlsend.com"
$VER_VAL = "mailerlite-domain-verification=36730fda75595ad50e7679ef0a3dfd6cdbf3b105"

$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".claude\porkbun-api.env"
if (-not (Test-Path $envFile)) {
  Write-Output "MISSING: $envFile"
  Write-Output "Create it with PORKBUN_API_KEY= and PORKBUN_SECRET_KEY= lines (see dns-fix.ps1 header)."
  exit 2
}
$kv = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^\s*([A-Z_]+)\s*=\s*(.+?)\s*$") { $kv[$Matches[1]] = $Matches[2] }
}
if (-not $kv["PORKBUN_API_KEY"] -or -not $kv["PORKBUN_SECRET_KEY"]) {
  Write-Output "env file present but keys missing"; exit 2
}
$AUTH = @{ apikey = $kv["PORKBUN_API_KEY"]; secretapikey = $kv["PORKBUN_SECRET_KEY"] }

function Call($path, $extra) {
  $b = @{}
  $AUTH.GetEnumerator() | ForEach-Object { $b[$_.Key] = $_.Value }
  if ($extra) { $extra.GetEnumerator() | ForEach-Object { $b[$_.Key] = $_.Value } }
  return Invoke-RestMethod -Method Post -Uri "https://api.porkbun.com/api/json/v3/$path" -ContentType "application/json" -Body ($b | ConvertTo-Json) -TimeoutSec 45
}

$before = Call "dns/retrieve/$D" $null
if ($before.status -ne "SUCCESS") { Write-Output "RETRIEVE FAILED: $($before.message)"; exit 1 }
$aCount  = @($before.records | Where-Object { $_.type -eq "A" }).Count
$mxCount = @($before.records | Where-Object { $_.type -eq "MX" }).Count
$acme    = @($before.records | Where-Object { $_.name -like "_acme-challenge*" }).Count
Write-Output "BEFORE: total=$($before.records.Count) A=$aCount MX=$mxCount acme=$acme"

# --- 1. SPF (a domain must have exactly one) ---
$spf = @($before.records | Where-Object { $_.type -eq "TXT" -and $_.content -like "v=spf1*" })
if ($spf.Count -ne 1) { Write-Output "ABORT: expected exactly 1 SPF record, found $($spf.Count). Fix by hand."; exit 1 }
if ($spf[0].content -eq $SPF_NEW) {
  Write-Output "STEP1 SPF: already correct, skipped"
} else {
  $res = Call "dns/edit/$D/$($spf[0].id)" @{ name = ""; type = "TXT"; content = $SPF_NEW; ttl = "600" }
  Write-Output "STEP1 SPF edit: $($res.status) $($res.message)"
  if ($res.status -ne "SUCCESS") { exit 1 }
}

# --- 2. DKIM CNAME ---
$dkim = @($before.records | Where-Object { $_.type -eq "CNAME" -and $_.name -like "$DKIM_NAME*" })
if ($dkim.Count -gt 0) {
  Write-Output "STEP2 DKIM CNAME: already exists, skipped"
} else {
  $res = Call "dns/create/$D" @{ name = $DKIM_NAME; type = "CNAME"; content = $DKIM_VAL; ttl = "600" }
  Write-Output "STEP2 DKIM CNAME create: $($res.status) $($res.message)"
  if ($res.status -ne "SUCCESS") { exit 1 }
}

# --- 3. Domain verification TXT at root ---
$ver = @($before.records | Where-Object { $_.type -eq "TXT" -and $_.content -like "mailerlite-domain-verification*" })
if ($ver.Count -gt 0) {
  Write-Output "STEP3 verification TXT: already exists, skipped"
} else {
  $res = Call "dns/create/$D" @{ name = ""; type = "TXT"; content = $VER_VAL; ttl = "600" }
  Write-Output "STEP3 verification TXT create: $($res.status) $($res.message)"
  if ($res.status -ne "SUCCESS") { exit 1 }
}

Start-Sleep -Seconds 3
$after = Call "dns/retrieve/$D" $null
$aCount2  = @($after.records | Where-Object { $_.type -eq "A" }).Count
$mxCount2 = @($after.records | Where-Object { $_.type -eq "MX" }).Count
$acme2    = @($after.records | Where-Object { $_.name -like "_acme-challenge*" }).Count
$spf2     = @($after.records | Where-Object { $_.type -eq "TXT" -and $_.content -like "v=spf1*" })
Write-Output ""
Write-Output "AFTER : total=$($after.records.Count) A=$aCount2 MX=$mxCount2 acme=$acme2"
$ok = $true
if ($aCount2  -ne $aCount)  { Write-Output "!! WARNING: A record count changed";  $ok = $false }
if ($mxCount2 -ne $mxCount) { Write-Output "!! WARNING: MX record count changed"; $ok = $false }
if ($acme2    -ne $acme)    { Write-Output "!! WARNING: acme-challenge count changed"; $ok = $false }
if ($spf2.Count -ne 1)      { Write-Output "!! WARNING: SPF count is $($spf2.Count), must be 1"; $ok = $false }
Write-Output ""
Write-Output "=== MAIL RECORDS NOW ==="
foreach ($rec in $after.records | Where-Object { $_.type -eq "TXT" -or ($_.type -eq "CNAME" -and $_.name -like "litesrv*") }) {
  Write-Output ("  {0,-6} {1,-42} {2}" -f $rec.type, $rec.name, $rec.content)
}
Write-Output ""
if ($ok) {
  Write-Output "DONE. Protected records intact. Next: wait for propagation, then press"
  Write-Output "'Check records' in MailerLite > Account settings > Domains > brainvsmath.com."
} else {
  Write-Output "FINISHED WITH WARNINGS - review the zone at porkbun.com before sending mail."
}
