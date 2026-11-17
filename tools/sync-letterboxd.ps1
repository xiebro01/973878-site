<#
.SYNOPSIS
    本机抓取 Letterboxd「看过的电影」，生成 data/movies.json。

.DESCRIPTION
    Letterboxd 会对机房 IP 返回 403，所以做成可本机运行：
    生成的 JSON 会被 /api/movies 自动发现（抓不到页面时的第三来源）。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\sync-letterboxd.ps1 -Username xie73
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Username,
    [string]$OutFile = ""
)

if (-not $OutFile) { $OutFile = Join-Path $PSScriptRoot '..\data\movies.json' }

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
$url = "https://letterboxd.com/$Username/films/"

Write-Host "抓取 $url ..." -ForegroundColor Cyan

try {
    $resp = Invoke-WebRequest -Uri $url -Headers @{
        'User-Agent'      = $UA
        'Accept'          = 'text/html,application/xhtml+xml'
        'Accept-Language' = 'zh-CN,zh;q=0.9,en;q=0.8'
    } -TimeoutSec 60 -UseBasicParsing
} catch {
    Write-Host "请求失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "如果是地区网络问题，先打开代理再跑一次。" -ForegroundColor Yellow
    exit 1
}

$html = $resp.Content
Write-Host ("页面大小：{0:N0} 字节" -f $html.Length)

if ($html.Length -lt 5000) {
    Write-Host "返回内容太小，可能被反爬拦了。" -ForegroundColor Red
    exit 2
}

$items = New-Object System.Collections.ArrayList
$seen = @{}
$matches = [regex]::Matches($html, 'data-target-link="/film/([^"/]+)/"')

foreach ($m in $matches) {
    $slug = $m.Groups[1].Value
    if ($seen.ContainsKey($slug)) { continue }
    $seen[$slug] = $true

    $len = [Math]::Min(3000, $html.Length - $m.Index)
    $chunk = $html.Substring($m.Index, $len)

    $title = [regex]::Match($chunk, 'alt="([^"]+)"').Groups[1].Value
    if (-not $title) { $title = $slug }

    $rated = [regex]::Match($chunk, 'rated-(\d+)').Groups[1].Value
    $rating5 = if ($rated) { [double]$rated / 2 } else { $null }

    $yearMatch = [regex]::Match($slug, '-(\d{4})$')

    [void]$items.Add([pscustomobject]@{
        title   = [System.Net.WebUtility]::HtmlDecode(($title -replace '\s*\(\d{4}\)$', ''))
        year    = if ($yearMatch.Success) { [int]$yearMatch.Groups[1].Value } else { $null }
        rating5 = $rating5
        url     = "https://letterboxd.com/film/$slug/"
    })
}

if ($items.Count -eq 0) {
    Write-Host "没解析到电影，页面结构可能变了。" -ForegroundColor Red
    $dbg = Join-Path $PSScriptRoot 'letterboxd-debug.html'
    [IO.File]::WriteAllText($dbg, $html, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "已保存 $dbg，发我可按真实结构改解析。" -ForegroundColor Gray
    exit 3
}

$payload = [pscustomobject]@{
    source  = 'letterboxd-local'
    updated = (Get-Date).ToString('yyyy-MM-dd')
    total   = $items.Count
    items   = @($items)
}

$dir = Split-Path -Parent $OutFile
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[IO.File]::WriteAllText($OutFile, ($payload | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("完成：{0} 部电影" -f $payload.total) -ForegroundColor Green
Write-Host "已写入 $OutFile" -ForegroundColor Gray
Write-Host "接下来：GitHub Desktop → Commit → Push" -ForegroundColor Cyan
