param(
  [string]$InputPath = 'd:\SynologyDrive\os_ard_dump_en.json',
  [string]$OutputPath = 'd:\SynologyDrive\os_ard_dump_ko.json'
)

$ErrorActionPreference = 'Stop'

$data = Get-Content -Raw -Path $InputPath | ConvertFrom-Json
$cache = @{}

function Is-EnglishText([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $false }
  return $text -match '[A-Za-z]'
}

function Normalize-O11Terms([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $text }
  $t = $text
  $t = $t -replace '\bOut systems\b', 'OutSystems'
  $t = $t -replace '\bService studio\b', 'Service Studio'
  $t = $t -replace '\bService center\b', 'Service Center'
  $t = $t -replace '\baggregate\b', 'Aggregate'
  $t = $t -replace '\bentity\b', 'Entity'
  return $t
}

function Translate-Text([string]$text) {
  if (-not (Is-EnglishText $text)) { return $text }
  if ($cache.ContainsKey($text)) { return $cache[$text] }

  $prefix = ''
  $core = $text
  if ($text -match '^[A-F]\.\s+') {
    $prefix = $Matches[0]
    $core = $text.Substring($prefix.Length)
  }

  if (-not (Is-EnglishText $core)) {
    $cache[$text] = $text
    return $text
  }

  $encoded = [uri]::EscapeDataString($core)
  $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=$encoded"

  try {
    $resp = Invoke-RestMethod -Uri $url -TimeoutSec 30
    $translated = ''
    foreach ($seg in $resp[0]) {
      if ($seg[0]) { $translated += $seg[0] }
    }

    if ([string]::IsNullOrWhiteSpace($translated)) {
      $translated = $core
    }

    $translated = Normalize-O11Terms $translated
    $final = "$prefix$translated"
    $cache[$text] = $final
    Start-Sleep -Milliseconds 120
    return $final
  }
  catch {
    $cache[$text] = $text
    return $text
  }
}

# Meta
$data.setMeta.title = Translate-Text([string]$data.setMeta.title)
$data.setMeta.description = Translate-Text([string]$data.setMeta.description)

$total = $data.questions.Count
for ($i = 0; $i -lt $total; $i++) {
  $q = $data.questions[$i]

  if ((($i + 1) % 25) -eq 0 -or $i -eq 0) {
    Write-Output ("Translating {0}/{1}" -f ($i + 1), $total)
  }

  $q.topic = Translate-Text([string]$q.topic)
  $q.stem = Translate-Text([string]$q.stem)
  $q.explanation = Translate-Text([string]$q.explanation)
  $q.source = Translate-Text([string]$q.source)

  $translatedChoices = @()
  foreach ($choice in $q.choices) {
    $translatedChoices += (Translate-Text([string]$choice))
  }
  $q.choices = $translatedChoices

  $translatedTags = @()
  foreach ($tag in $q.tags) {
    $translatedTags += (Translate-Text([string]$tag))
  }
  $q.tags = $translatedTags
}

$data | ConvertTo-Json -Depth 100 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "DONE: $OutputPath"