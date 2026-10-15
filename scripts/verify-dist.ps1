# Verifies the built JS bundle contains no root-absolute asset paths.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$js = Get-Content (Join-Path $root 'dist\cardnew\browser\main-3BBFU77Q.js') -Raw

$relMedia = ([regex]::Matches($js, '\./media/')).Count
$allMedia = ([regex]::Matches($js, '/media/')).Count
$absAssetsDouble = ([regex]::Matches($js, '"/assets/')).Count
$absAssetsSingle = ([regex]::Matches($js, "'/assets/")).Count
$imagesRefs = ([regex]::Matches($js, 'assets/images/')).Count

Write-Output ('relative ./media/ refs        = ' + $relMedia)
Write-Output ('absolute /media/ refs         = ' + ($allMedia - $relMedia))
Write-Output ('absolute double-quote /assets/ = ' + $absAssetsDouble)
Write-Output ('absolute single-quote /assets/ = ' + $absAssetsSingle)
Write-Output ('relative assets/images/ refs   = ' + $imagesRefs)
