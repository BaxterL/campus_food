# 修复 @form-create/element-ui 与 element-plus 2.6.1 不兼容（P0 本地跑 admin 用）
$target = Join-Path $PSScriptRoot "..\node_modules\@form-create\element-ui\auto-import.js"
if (-not (Test-Path $target)) { exit 0 }
$c = Get-Content $target -Raw
$c = $c -replace ",\s*ElInputTag,", ","
$c = $c -replace ",\s*ElMention,", ","
$c = $c -replace "import 'element-plus/es/components/input-tag/style/css'\r?\n", "// patched input-tag`n"
$c = $c -replace "import 'element-plus/es/components/mention/style/css'\r?\n", "// patched mention`n"
$c = $c -replace "\s*app\.component\(ElInputTag\.name\)[^\n]+\n", ""
$c = $c -replace "\s*app\.component\(ElMention\.name\)[^\n]+\n", ""
Set-Content -Path $target -Value $c -NoNewline
Write-Host "patched form-create auto-import.js"
