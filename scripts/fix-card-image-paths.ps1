# Replaces absolute asset paths in character-card.ts with relative ones,
# so card images resolve correctly on GitHub Pages under a subpath (/hero-message-day/).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root 'src\app\models\character-card.ts'

$text = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$count = ([regex]::Matches($text, "image: '/assets/images/")).Count
if ($count -eq 0) {
    Write-Host "No 'image: ''/assets/images/'' occurrences found - nothing to replace."
} else {
    $text = $text.Replace("image: '/assets/images/", "image: 'assets/images/")
    [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Replaced $count occurrences in $file"
}
