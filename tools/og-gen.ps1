# Generates assets/img/og.png (1200x630) and PWA icons via System.Drawing.
# Re-run any time: powershell -ExecutionPolicy Bypass -File tools\og-gen.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$imgDir = Join-Path $root "assets\img"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

$bgCol   = [System.Drawing.Color]::FromArgb(11, 18, 32)
$surfCol = [System.Drawing.Color]::FromArgb(26, 36, 56)
$pink    = [System.Drawing.Color]::FromArgb(244, 114, 182)
$cyan    = [System.Drawing.Color]::FromArgb(34, 211, 238)
$textCol = [System.Drawing.Color]::FromArgb(231, 237, 247)
$mutCol  = [System.Drawing.Color]::FromArgb(159, 176, 200)

# ---------- OG image ----------
$bmp = New-Object System.Drawing.Bitmap(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear($bgCol)

# faint scattered math glyphs
$glyphFont = New-Object System.Drawing.Font("Segoe UI", 46, [System.Drawing.FontStyle]::Bold)
$faintPink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 244, 114, 182))
$faintCyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 34, 211, 238))
$mul = [string][char]0x00D7   # multiplication sign
$div = [string][char]0x00F7   # division sign
$min = [string][char]0x2212   # minus sign
$glyphs = @(
  @("25", 60, 60, $faintCyan), @($div, 240, 480, $faintPink), @($mul, 1050, 90, $faintPink),
  @("7", 940, 500, $faintCyan), @("100", 1010, 320, $faintCyan), @("+", 90, 300, $faintPink),
  @($min, 620, 60, $faintCyan), @("438", 340, 90, $faintPink)
)
foreach ($it in $glyphs) { $g.DrawString($it[0], $glyphFont, $it[3], [single]$it[1], [single]$it[2]) }

# number tiles row
$tileFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
$tileBrush = New-Object System.Drawing.SolidBrush($surfCol)
$tilePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 148, 163, 184), 2)
$tileText = New-Object System.Drawing.SolidBrush($textCol)
$nums = @("75", "8", "3", "50", "6", "9")
$x = 330
foreach ($n in $nums) {
  $rect = New-Object System.Drawing.Rectangle($x, 400, 84, 84)
  $g.FillRectangle($tileBrush, $rect)
  $g.DrawRectangle($tilePen, $rect)
  $sz = $g.MeasureString($n, $tileFont)
  $g.DrawString($n, $tileFont, $tileText, $x + (84 - $sz.Width) / 2, 400 + (84 - $sz.Height) / 2)
  $x += 96
}

# headline: Brain VS Math
$big = New-Object System.Drawing.Font("Segoe UI", 84, [System.Drawing.FontStyle]::Bold)
$vsF = New-Object System.Drawing.Font("Segoe UI", 40, [System.Drawing.FontStyle]::Bold)
$bBrush = New-Object System.Drawing.SolidBrush($pink)
$mBrush = New-Object System.Drawing.SolidBrush($cyan)
$vBrush = New-Object System.Drawing.SolidBrush($mutCol)
$bSize = $g.MeasureString("Brain", $big)
$vSize = $g.MeasureString("vs", $vsF)
$mSize = $g.MeasureString("Math", $big)
$totalW = $bSize.Width + $vSize.Width + $mSize.Width + 20
$startX = (1200 - $totalW) / 2
$y = 150
$g.DrawString("Brain", $big, $bBrush, $startX, $y)
$g.DrawString("vs", $vsF, $vBrush, $startX + $bSize.Width + 8, $y + 62)
$g.DrawString("Math", $big, $mBrush, $startX + $bSize.Width + $vSize.Width + 20, $y)

# subtitle
$sub = New-Object System.Drawing.Font("Segoe UI", 27)
$subBrush = New-Object System.Drawing.SolidBrush($textCol)
$subText = "Daily math games - a new puzzle every day. Free, no signup."
$sSize = $g.MeasureString($subText, $sub)
$g.DrawString($subText, $sub, $subBrush, (1200 - $sSize.Width) / 2, 320)

$g.Dispose()
$bmp.Save((Join-Path $imgDir "og.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "og.png written"

# ---------- PWA icons ----------
foreach ($size in @(192, 512)) {
  $ib = New-Object System.Drawing.Bitmap($size, $size)
  $ig = [System.Drawing.Graphics]::FromImage($ib)
  $ig.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $ig.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $ig.Clear($bgCol)

  $f = New-Object System.Drawing.Font("Segoe UI", [single]($size * 0.34), [System.Drawing.FontStyle]::Bold)
  $bB = New-Object System.Drawing.SolidBrush($pink)
  $mB = New-Object System.Drawing.SolidBrush($cyan)
  $bS = $ig.MeasureString("B", $f)
  $mS = $ig.MeasureString("M", $f)
  $cy = ($size - $bS.Height) / 2
  $ig.DrawString("B", $f, $bB, $size * 0.16, $cy)
  $ig.DrawString("M", $f, $mB, $size * 0.84 - $mS.Width, $cy)

  $slashPen = New-Object System.Drawing.Pen($mutCol, [single]($size * 0.02))
  $slashPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $slashPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $ig.DrawLine($slashPen, [single]($size * 0.57), [single]($size * 0.22), [single]($size * 0.43), [single]($size * 0.78))

  $ig.Dispose()
  $ib.Save((Join-Path $imgDir ("icon-" + $size + ".png")), [System.Drawing.Imaging.ImageFormat]::Png)
  $ib.Dispose()
  Write-Output ("icon-" + $size + ".png written")
}
