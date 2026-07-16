# ============================================================
# domain-day.ps1 - one-shot migration of every asset to the
# custom domain. Run AFTER buying the domain, BEFORE (ideally)
# uploading products to Payhip.
#
#   powershell -ExecutionPolicy Bypass -File tools\domain-day.ps1 -Domain brainvsmath.com
#
# What it does (file transforms only - commit/push/DNS are listed
# at the end as a checklist):
#   1. Replaces https://allforyou-bit.github.io/brainvsmath -> https://<domain>
#      across site files, tools and docs (canonicals, OG, sitemap,
#      robots, config.js siteUrl, share URLs, tool SITE constants).
#   2. Fixes 404.html absolute paths (/brainvsmath/ -> /).
#   3. Writes the CNAME file for GitHub Pages.
#   4. Regenerates products, free sample and pins so PDFs/PNGs
#      carry the new domain.
# ============================================================
param([Parameter(Mandatory = $true)][string]$Domain)

$root = Split-Path $PSScriptRoot -Parent
$enc = New-Object System.Text.UTF8Encoding($false)
$oldFull = "https://allforyou-bit.github.io/brainvsmath"
$oldBare = "allforyou-bit.github.io/brainvsmath"

Write-Output "== 1/4 rewriting URLs to $Domain =="
$files = Get-ChildItem $root -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\\.git\\' -and
  $_.FullName -notmatch '\\PRODUCTS\\' -and
  $_.Extension -in @('.html', '.js', '.txt', '.xml', '.webmanifest', '.md', '.mjs', '.py', '.ps1')
}
$changed = 0
foreach ($f in $files) {
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $n = $c.Replace($oldFull, "https://$Domain").Replace($oldBare, $Domain)
  if ($n -ne $c) {
    [System.IO.File]::WriteAllText($f.FullName, $n, $enc)
    $changed++
  }
}
Write-Output "   $changed files updated"

Write-Output "== 2/4 fixing 404.html absolute paths =="
$p404 = Join-Path $root "404.html"
$c404 = [System.IO.File]::ReadAllText($p404)
$c404 = $c404.Replace('"/brainvsmath/', '"/')
[System.IO.File]::WriteAllText($p404, $c404, $enc)

Write-Output "== 3/4 writing CNAME =="
[System.IO.File]::WriteAllText((Join-Path $root "CNAME"), $Domain + "`n", $enc)

Write-Output "== 4/4 regenerating products, sample and pins with new domain =="
node (Join-Path $root "tools\gen-puzzles.mjs")
python (Join-Path $root "tools\build_products.py")
python -c @"
import fitz, os
root = r'$root'
d = fitz.open(root + r'\PRODUCTS\Multiplication-Mastery-Pack-v1.pdf')
d.select([0, 1, 2, 38, 62])
for i, page in enumerate(d):
    if i == 0: continue
    page.insert_text((430, 780), 'FREE SAMPLE - full pack: 60 sheets', fontsize=9, color=(0.55, 0.6, 0.7))
d.save(root + r'\assets\downloads\multiplication-pack-free-sample.pdf', garbage=4, deflate=True)
d.close()
for src, out in [(r'\PRODUCTS\Multiplication-Mastery-Pack-v1.pdf', r'\assets\img\shop-pack.png'),
                 (r'\PRODUCTS\Daily-Target-Puzzle-Book-Vol1.pdf', r'\assets\img\shop-book.png')]:
    doc = fitz.open(root + src)
    doc[0].get_pixmap(dpi=96).save(root + out)
    doc.close()
print('sample + thumbnails regenerated')
"@
powershell -ExecutionPolicy Bypass -File (Join-Path $root "tools\pin-gen.ps1")

Write-Output ""
Write-Output "================ DONE - manual checklist ================"
Write-Output "1. DNS at your registrar:"
Write-Output "   A records @ -> 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153"
Write-Output "   CNAME www -> allforyou-bit.github.io  (proxy OFF if Cloudflare)"
Write-Output "2. gh api -X PUT repos/allforyou-bit/brainvsmath/pages -f cname=$Domain"
Write-Output "3. Review changes, then commit + push (deploy is automatic)."
Write-Output "4. After cert issues (~15min-24h): enforce HTTPS in Pages settings."
Write-Output "5. Search Console: add new domain property + resubmit sitemap."
Write-Output "6. If products were already uploaded to Payhip: replace the PDF files there."
Write-Output "7. AdSense clock starts now - apply after ~2-4 weeks + 20 pages."
