<#
.SYNOPSIS
    在你自己的电脑上抓 Steam 游戏库，生成 data/games.json。

.DESCRIPTION
    Cloudflare 的机房 IP 访问 Steam 会被丢到登录页，所以改成本机运行：
    你的家用网络通常能看到公开资料页，抓到之后写进仓库，站点直接读静态文件。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\sync-steam.ps1 -SteamId 76561199245521235
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SteamId,
    [string]$OutFile = ""
)

if (-not $OutFile) { $OutFile = Join-Path $PSScriptRoot '..\data\games.json' }

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
$path = if ($SteamId -match '^\d{17}$') { "profiles/$SteamId" } else { "id/$([uri]::EscapeDataString($SteamId))" }
$url = "https://steamcommunity.com/$path/games?tab=all&sort=playtime"

Write-Host "抓取 $url ..." -ForegroundColor Cyan

try {
    $resp = Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent' = $UA } -TimeoutSec 60 -UseBasicParsing
} catch {
    Write-Host "请求失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "如果是地区网络问题，先打开代理再跑一次。" -ForegroundColor Yellow
    exit 1
}

$html = $resp.Content
Write-Host ("页面大小：{0:N0} 字节" -f $html.Length)

if ($html -match 'Steam Community\s*::\s*Sign In') {
    Write-Host "Steam 返回的是登录页，抓不到库。" -ForegroundColor Red
    Write-Host "解决：先在浏览器里登录 steamcommunity.com，或在有代理的网络下重试。" -ForegroundColor Yellow
    exit 2
}

if ($html -match 'This profile is private') {
    Write-Host "资料是私密的：Steam → 个人资料 → 编辑 → 隐私设置 → 游戏详情 = 公开" -ForegroundColor Red
    exit 3
}

$games = New-Object System.Collections.ArrayList

# 结构一：页面内嵌 JSON  g_rgAppInfo = {"620":{"name":"...","hours":12.5}, ...}
$blob = [regex]::Match($html, 'g_rgAppInfo\s*=\s*(\{[\s\S]*?\});')
if ($blob.Success) {
    try {
        $obj = $blob.Groups[1].Value | ConvertFrom-Json
        foreach ($p in $obj.PSObject.Properties) {
            $g = $p.Value
            if ($g.name) {
                [void]$games.Add([pscustomobject]@{
                    id      = [int]$p.Name
                    name    = [string]$g.name
                    minutes = [int]([double]$g.hours * 60)
                })
            }
        }
    } catch { }
}

# 结构二：行级 DOM  <div class="gameListRow" id="game_620"> ... 名称 ... 时长
if ($games.Count -eq 0) {
    $marks = [regex]::Matches($html, '<div[^>]*class="[^"]*gameListRow[^"]*"[^>]*>')
    $starts = @()
    foreach ($m in $marks) {
        if ($m.Value -match 'gameListRow(Item|Border)') { continue }
        $starts += $m.Index
    }

    for ($i = 0; $i -lt $starts.Count; $i++) {
        $start = $starts[$i]
        $end = if ($i + 1 -lt $starts.Count) { $starts[$i + 1] } else { [Math]::Min($html.Length, $start + 6000) }
        $chunk = $html.Substring($start, $end - $start)

        $appid = [regex]::Match($chunk, 'id="game_(\d+)"').Groups[1].Value
        if (-not $appid) { $appid = [regex]::Match($chunk, 'store\.steampowered\.com/app/(\d+)').Groups[1].Value }
        if (-not $appid) { continue }

        $name = [regex]::Match($chunk, 'gameListRowItemName[^>]*>([^<]+)<').Groups[1].Value
        if (-not $name) { continue }

        $hoursText = [regex]::Match($chunk, '([\d.,]+)\s*(?:hrs|小时)').Groups[1].Value
        $hours = 0.0
        if ($hoursText) { [void][double]::TryParse($hoursText.Replace(',', ''), [ref]$hours) }

        [void]$games.Add([pscustomobject]@{
            id      = [int]$appid
            name    = [System.Net.WebUtility]::HtmlDecode($name.Trim())
            minutes = [int]($hours * 60)
        })
    }
}

if ($games.Count -eq 0) {
    Write-Host "页面拿到了，但没解析出游戏。" -ForegroundColor Red
    Write-Host "把这一页另存为 HTML 发我，我照真实结构改解析。" -ForegroundColor Yellow
    $dbg = Join-Path $PSScriptRoot 'steam-debug.html'
    [IO.File]::WriteAllText($dbg, $html, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "已保存到 $dbg" -ForegroundColor Gray
    exit 4
}

$sorted = $games | Sort-Object -Property @{ Expression = { $_.minutes }; Descending = $true }
$totalMinutes = ($sorted | Measure-Object -Property minutes -Sum).Sum

$items = foreach ($g in $sorted) {
    [pscustomobject]@{
        id    = $g.id
        name  = $g.name
        hours = [Math]::Round($g.minutes / 60, 1)
        cover = "https://cdn.cloudflare.steamstatic.com/steam/apps/$($g.id)/library_600x900.jpg"
        url   = "https://store.steampowered.com/app/$($g.id)"
    }
}

$payload = [pscustomobject]@{
    source  = 'steam-local'
    updated = (Get-Date).ToString('yyyy-MM-dd')
    total   = $items.Count
    hours   = [Math]::Round($totalMinutes / 60)
    items   = @($items)
}

$dir = Split-Path -Parent $OutFile
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[IO.File]::WriteAllText($OutFile, ($payload | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("完成：{0} 款游戏，累计 {1} 小时" -f $payload.total, $payload.hours) -ForegroundColor Green
Write-Host "已写入 $OutFile" -ForegroundColor Gray
Write-Host "接下来：GitHub Desktop → Commit → Push，站点会自动用这份数据。" -ForegroundColor Cyan
