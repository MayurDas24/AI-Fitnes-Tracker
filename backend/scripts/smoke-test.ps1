param(
  [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = 'Stop'

$passed = 0
$failed = 0

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if ($Condition) {
    Write-Host "[PASS] $Message" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:failed++
  }
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Path,
    $Body = $null,
    [hashtable]$Headers = @{}
  )

  $params = @{
    Uri         = "$BaseUrl$Path"
    Method      = $Method
    Headers     = $Headers
    ContentType = 'application/json'
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
  }

  return Invoke-RestMethod @params
}

function Invoke-JsonExpectStatus {
  param(
    [string]$Method,
    [string]$Path,
    [int]$ExpectedStatus,
    $Body = $null,
    [hashtable]$Headers = @{}
  )

  try {
    $requestParams = @{
      Uri         = "$BaseUrl$Path"
      Method      = $Method
      Headers     = $Headers
      ContentType = 'application/json'
      ErrorAction = 'Stop'
    }

    if ($null -ne $Body) {
      $requestParams.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }

    $response = Invoke-WebRequest @requestParams
    return @{
      Status = [int]$response.StatusCode
      Body   = $response.Content
    }
  } catch {
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $respBody = $reader.ReadToEnd()
      $reader.Close()
      $statusCode = $_.Exception.Response.StatusCode.value__
      return @{
        Status = [int]$statusCode
        Body   = $respBody
      }
    }
    throw
  }
}

Write-Host "=== Backend Smoke Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan

# Health check
try {
  $health = Invoke-Json -Method GET -Path "/api/health"
  Assert-True ($health.status -eq 'ok') "GET /api/health returns status=ok"
} catch {
  Write-Host "[FAIL] Cannot reach backend at $BaseUrl. Start backend server first (npm run start in backend)." -ForegroundColor Red
  exit 1
}

# Create temporary user
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$tempEmail = "smoke.$stamp@example.com"
$tempPassword = "SmokePass123!"

$signup = Invoke-Json -Method POST -Path "/api/auth/signup" -Body @{
  name     = "Smoke User"
  email    = $tempEmail
  password = $tempPassword
}

Assert-True (![string]::IsNullOrWhiteSpace($signup.token)) "POST /api/auth/signup returns token"
$token = $signup.token
$authHeaders = @{ Authorization = "Bearer $token" }

# Auth profile
$me = Invoke-Json -Method GET -Path "/api/auth/me" -Headers $authHeaders
Assert-True ($me.email -eq $tempEmail) "GET /api/auth/me returns created user"

# Workouts
$workout = Invoke-Json -Method POST -Path "/api/workouts" -Headers $authHeaders -Body @{
  date          = (Get-Date -Format 'yyyy-MM-dd')
  exercises     = 4
  completedSets = 12
  volume        = 2400
  calories      = 320
  duration      = 45
  workoutData   = @(@{ name = "Push Up"; sets = 3; reps = 12 })
}
Assert-True ($null -ne $workout._id) "POST /api/workouts creates workout"

$workouts = Invoke-Json -Method GET -Path "/api/workouts" -Headers $authHeaders
Assert-True ($workouts.Count -ge 1) "GET /api/workouts returns list"

# Meals
$meal = Invoke-Json -Method POST -Path "/api/meals" -Headers $authHeaders -Body @{
  date     = (Get-Date -Format 'yyyy-MM-dd')
  name     = "Chicken Rice"
  calories = 650
  protein  = 45
  carbs    = 70
  fat      = 18
  mealType = "dinner"
}
Assert-True ($null -ne $meal._id) "POST /api/meals creates meal"

$meals = Invoke-Json -Method GET -Path "/api/meals" -Headers $authHeaders
Assert-True ($meals.Count -ge 1) "GET /api/meals returns list"

# Progress
$progress = Invoke-Json -Method POST -Path "/api/progress" -Headers $authHeaders -Body @{
  date         = (Get-Date -Format 'yyyy-MM-dd')
  weight       = 72.4
  bodyFat      = 17.2
  measurements = @{ chest = 96; waist = 81 }
  photos       = @("https://example.com/p.jpg")
  notes        = "Smoke entry"
}
Assert-True ($null -ne $progress._id) "POST /api/progress upserts progress"

$progressList = Invoke-Json -Method GET -Path "/api/progress" -Headers $authHeaders
Assert-True ($progressList.Count -ge 1) "GET /api/progress returns list"

# Water
$water = Invoke-Json -Method POST -Path "/api/water" -Headers $authHeaders -Body @{
  date   = (Get-Date -Format 'yyyy-MM-dd')
  amount = 1500
  goal   = 2500
}
Assert-True ($null -ne $water._id) "POST /api/water creates or updates water record"

$waterToday = Invoke-Json -Method GET -Path "/api/water/today" -Headers $authHeaders
Assert-True ($null -ne $waterToday) "GET /api/water/today returns record"

# Favorites
$fav = Invoke-Json -Method POST -Path "/api/favorites" -Headers $authHeaders -Body @{
  exerciseId   = "push-up"
  exerciseName = "Push Up"
  category     = "Chest"
}
Assert-True ($null -ne $fav._id) "POST /api/favorites creates favorite"

$favs = Invoke-Json -Method GET -Path "/api/favorites" -Headers $authHeaders
Assert-True ($favs.Count -ge 1) "GET /api/favorites returns list"

# Body analysis
$analysis = Invoke-Json -Method POST -Path "/api/body-analysis" -Headers $authHeaders -Body @{
  name        = "Week 1"
  photoUrl    = "https://example.com/body.jpg"
  focusAreas  = @("core", "chest")
  trainingPlan = "3 strength days + 2 cardio"
}
Assert-True ($null -ne $analysis._id) "POST /api/body-analysis creates entry"

$analyses = Invoke-Json -Method GET -Path "/api/body-analysis" -Headers $authHeaders
Assert-True ($analyses.Count -ge 1) "GET /api/body-analysis returns list"

# Calculations
$calc = Invoke-Json -Method POST -Path "/api/calculations" -Headers $authHeaders -Body @{
  calculationType = "bmi"
  inputs          = @{ weight = 72.4; height = 1.75 }
  results         = @{ bmi = 23.6; category = "Normal" }
}
Assert-True ($null -ne $calc._id) "POST /api/calculations creates calculation"

$calcs = Invoke-Json -Method GET -Path "/api/calculations" -Headers $authHeaders
Assert-True ($calcs.Count -ge 1) "GET /api/calculations returns list"

# Negative checks
$badTokenResponse = Invoke-JsonExpectStatus -Method GET -Path "/api/workouts" -ExpectedStatus 401 -Headers @{}
Assert-True ($badTokenResponse.Status -eq 401) "GET /api/workouts without token returns 401"

$big = "a" * 6291456
$largePayloadResult = Invoke-JsonExpectStatus -Method POST -Path "/api/auth/login" -ExpectedStatus 413 -Body @{ email = "x@example.com"; password = $big }
Assert-True ($largePayloadResult.Status -eq 413) "POST /api/auth/login with >5mb payload returns 413"

Write-Host ""
Write-Host "=== Smoke Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"

if ($failed -gt 0) {
  exit 1
}

exit 0
