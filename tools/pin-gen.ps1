# Generates Pinterest pin images (1000x1500) into PRODUCTS\pins\
# Run: powershell -ExecutionPolicy Bypass -File tools\pin-gen.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "PRODUCTS\pins"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$navy  = [System.Drawing.Color]::FromArgb(11, 18, 32)
$pink  = [System.Drawing.Color]::FromArgb(244, 114, 182)
$cyan  = [System.Drawing.Color]::FromArgb(34, 211, 238)
$paper = [System.Drawing.Color]::FromArgb(246, 248, 252)
$ink   = [System.Drawing.Color]::FromArgb(16, 28, 49)
$grey  = [System.Drawing.Color]::FromArgb(90, 105, 130)
$mul   = [string][char]0x00D7

function New-Pin($fileName, $topLines, $midLines, $chips, $cta) {
  $bmp = New-Object System.Drawing.Bitmap(1000, 1500)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($paper)

  # top navy band with brand
  $bandBrush = New-Object System.Drawing.SolidBrush($navy)
  $g.FillRectangle($bandBrush, 0, 0, 1000, 150)
  $brandFont = New-Object System.Drawing.Font("Segoe UI", 26, [System.Drawing.FontStyle]::Bold)
  $bW = $g.MeasureString("BRAIN ", $brandFont).Width
  $vW = $g.MeasureString("vs ", $brandFont).Width
  $tot = $bW + $vW + $g.MeasureString("MATH", $brandFont).Width
  $x0 = (1000 - $tot) / 2
  $g.DrawString("BRAIN ", $brandFont, (New-Object System.Drawing.SolidBrush($pink)), $x0, 52)
  $g.DrawString("vs ", $brandFont, (New-Object System.Drawing.SolidBrush($grey)), $x0 + $bW, 52)
  $g.DrawString("MATH", $brandFont, (New-Object System.Drawing.SolidBrush($cyan)), $x0 + $bW + $vW, 52)

  # headline
  $h1 = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
  $inkBrush = New-Object System.Drawing.SolidBrush($ink)
  $y = 260
  foreach ($ln in $topLines) {
    $w = $g.MeasureString($ln, $h1).Width
    $g.DrawString($ln, $h1, $inkBrush, (1000 - $w) / 2, $y)
    $y += 92
  }
  # accent bar
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($pink)), 380, $y + 26, 110, 9)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($cyan)), 510, $y + 26, 110, 9)
  $y += 78

  # midlines
  $h2 = New-Object System.Drawing.Font("Segoe UI", 30)
  $greyBrush = New-Object System.Drawing.SolidBrush($grey)
  foreach ($ln in $midLines) {
    $w = $g.MeasureString($ln, $h2).Width
    $g.DrawString($ln, $h2, $greyBrush, (1000 - $w) / 2, $y)
    $y += 52
  }

  # chips row (worksheet-tile motif)
  $chipFont = New-Object System.Drawing.Font("Segoe UI", 40, [System.Drawing.FontStyle]::Bold)
  $cw = 130; $gap = 22
  $cx = (1000 - ($chips.Count * $cw + ($chips.Count - 1) * $gap)) / 2
  $cy = 880
  foreach ($ch in $chips) {
    $rect = New-Object System.Drawing.Rectangle([int]$cx, $cy, $cw, $cw)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)), $rect)
    $pen = New-Object System.Drawing.Pen($ink, 3)
    $g.DrawRectangle($pen, $rect)
    $sz = $g.MeasureString($ch, $chipFont)
    $g.DrawString($ch, $chipFont, $inkBrush, $cx + ($cw - $sz.Width) / 2, $cy + ($cw - $sz.Height) / 2)
    $cx += $cw + $gap
  }

  # CTA button
  $ctaFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $ctaSz = $g.MeasureString($cta, $ctaFont)
  $btnW = $ctaSz.Width + 120; $btnH = 110
  $btnX = (1000 - $btnW) / 2; $btnY = 1170
  $navyBrush = New-Object System.Drawing.SolidBrush($navy)
  $g.FillEllipse($navyBrush, [single]$btnX, [single]$btnY, [single]$btnH, [single]$btnH)
  $g.FillEllipse($navyBrush, [single]($btnX + $btnW - $btnH), [single]$btnY, [single]$btnH, [single]$btnH)
  $g.FillRectangle($navyBrush, [single]($btnX + $btnH / 2), [single]$btnY, [single]($btnW - $btnH), [single]$btnH)
  $g.DrawString($cta, $ctaFont, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)), [single]($btnX + ($btnW - $ctaSz.Width) / 2), [single]($btnY + ($btnH - $ctaSz.Height) / 2))

  # footer site
  $f = New-Object System.Drawing.Font("Segoe UI", 24)
  $site = "brainvsmath.com"
  $sw = $g.MeasureString($site, $f).Width
  $g.DrawString($site, $f, $greyBrush, (1000 - $sw) / 2, 1420)

  $g.Dispose()
  $bmp.Save((Join-Path $outDir $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("pin: " + $fileName)
}

New-Pin "pin-free-generator.png" @("FREE Math", "Worksheet", "Generator") @("Answer keys included - no signup, no watermark", "Addition - Subtraction - Multiplication - Division") @("9$mul5", "45") "Print yours free"
New-Pin "pin-mastery-pack.png" @("60 No-Prep", "Multiplication", "Worksheets") @("Tables 2-12 + mixed practice + speed drills", "Full answer keys - grades 3-5 - instant PDF") @("7$mul8", "56") "Get the pack"
New-Pin "pin-puzzle-book.png" @("100 Number", "Puzzles") @("Reach the target with six numbers", "Warm-up to Expert - solutions included") @("75", "8", "3") "Get the book"
New-Pin "pin-daily-game.png" @("A New Math", "Puzzle Every", "Day") @("Free browser game - keep your streak alive", "5 difficulty tiers, from Warm-up to Expert") @("25", "+", "50") "Play free today"
New-Pin "pin-prime-checker.png" @("Is It Prime?", "Find Out Fast") @("Prime factorization + every divisor, explained", "Free checker - no signup - works to a trillion") @("2", "3", "5", "7") "Check any number"
New-Pin "pin-prime-chart.png" @("Prime Numbers", "Chart to 200") @("Printable reference for grades 4-7", "46 primes circled + the full list") @("11", "13", "17") "Print it free"
New-Pin "pin-roman-converter.png" @("Roman Numerals", "Made Simple") @("Type a number or a numeral - it converts both ways", "Every rule shown, plus a practice quiz") @("IV", "IX", "XL") "Convert it free"
New-Pin "pin-roman-chart.png" @("Roman Numerals", "Chart + Quiz") @("Printable chart with 12 practice problems", "Answer key included - grades 4-7") @("X", "L", "C", "M") "Print it free"
New-Pin "pin-telling-time.png" @("Telling Time", "Worksheets") @("12 clock faces per page + answer key", "O'clock to the minute - 5 levels - grades 1-3") @("3:45", "9:20") "Print it free"
New-Pin "pin-clock-practice.png" @("Read The Clock", "Or Draw It") @("Two worksheet types from one free page", "Fresh clocks every print - no signup") @("12", "3", "6", "9") "Practice free"
New-Pin "pin-money-worksheets.png" @("Counting Money", "Worksheets") @("12 coin piles per page + answer key", 'Pennies to $20 bills - 5 levels - grades 1-3') @("25", "10", "5", "1") "Print it free"
New-Pin "pin-making-change.png" @("Making Change", "Without Borrowing") @("Count up from the price - the cashier method", "Free practice page + printable sheets, no signup") @('$5.00', '-', '$3.47') "Practice free"
New-Pin "pin-ratio-calculator.png" @("Simplify Any", "Ratio In One", "Step") @("Divide every term by their common factor", "Free calculator - shows the working - no signup") @("8:12", "=", "2:3") "Try it free"
New-Pin "pin-share-in-ratio.png" @("Share Any", "Amount In A", "Ratio") @("Count the parts, find one part, multiply back", "Proportions + printable worksheets with keys") @("3", ":", "5") "Print it free"
