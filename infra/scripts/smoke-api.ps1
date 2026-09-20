# API smoke test for campus_food lightweight stack.
# Requires API on http://localhost:3000 (pnpm dev:api).

$ErrorActionPreference = 'Stop'
$Base = if ($env:SMOKE_API_BASE) { $env:SMOKE_API_BASE } else { 'http://localhost:3000/api/v1' }

function DevHeaders([string]$UserId, [string]$Role, [string]$MerchantId = $null) {
  $headers = @{
    'x-dev-user-id' = $UserId
    'x-dev-role'    = $Role
    'Content-Type'  = 'application/json'
  }
  if ($MerchantId) { $headers['x-dev-merchant-id'] = $MerchantId }
  return $headers
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [hashtable]$Headers,
    [object]$Body = $null,
    [string]$IdempotencyKey = $null
  )
  $uri = "$Base$Path"
  $params = @{ Method = $Method; Uri = $uri; Headers = $Headers }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress) }
  if ($IdempotencyKey) { $params.Headers['idempotency-key'] = $IdempotencyKey }
  return Invoke-RestMethod @params
}

Write-Host "== health =="
$live = Invoke-Api GET '/health/live' @{}
if ($live.status -ne 'ok') { throw "health/live failed" }
Write-Host "OK live"

Write-Host "== merchant staff overview =="
$merchantStats = Invoke-Api GET '/ops/overview/stats' (DevHeaders 'seed-user-merchant' 'merchant_staff' 'seed-merchant-1')
if ($merchantStats.scope -ne 'merchant') { throw "merchant stats scope expected merchant, got $($merchantStats.scope)" }
Write-Host "OK merchant overview scope=$($merchantStats.scope)"

Write-Host "== platform overview =="
$platformStats = Invoke-Api GET '/ops/overview/stats' (DevHeaders 'seed-user-admin' 'platform_admin')
if ($platformStats.scope -ne 'platform') { throw "platform stats scope expected platform" }
Write-Host "OK platform overview"

$studentHeaders = DevHeaders 'seed-user-student' 'student'
$merchantHeaders = DevHeaders 'seed-user-merchant' 'merchant' 'seed-merchant-1'

Write-Host "== pickup loop (no rider) =="
$pickupKey = "smoke-pickup-$(Get-Date -Format 'yyyyMMddHHmmss')"
$pickupBody = @{
  merchantId      = 'seed-merchant-1'
  fulfillmentType = 'PICKUP'
  items           = @(@{ skuId = 'seed-sku-1'; qty = 1 })
  idempotencyKey  = $pickupKey
}
$pickupOrder = Invoke-Api POST '/orders' $studentHeaders $pickupBody $pickupKey
$pickupId = $pickupOrder.id
if (-not $pickupId) { throw 'pickup create missing id' }
Invoke-Api POST "/orders/$pickupId/payments" $studentHeaders @{ provider = 'MOCK' } | Out-Null
Invoke-Api POST "/merchant/orders/$pickupId/ready" $merchantHeaders | Out-Null
$pickupReady = Invoke-Api GET "/orders/$pickupId" $studentHeaders
if ($pickupReady.status -notin @('ready', 'READY')) { throw "pickup expected ready, got $($pickupReady.status)" }
$pickupCodeOnly = $pickupReady.pickupCode
if (-not $pickupCodeOnly) { throw 'pickup missing pickupCode' }
if ($pickupReady.deliveryCode) { throw 'pickup should not have deliveryCode' }
Invoke-Api POST "/merchant/orders/$pickupId/verify-pickup" $merchantHeaders @{ pickupCode = $pickupCodeOnly } | Out-Null
$pickupDone = Invoke-Api GET "/orders/$pickupId" $studentHeaders
if ($pickupDone.status -notin @('completed', 'COMPLETED')) {
  throw "pickup expected completed, got $($pickupDone.status)"
}
Write-Host "OK pickup closed order=$pickupId"

Write-Host "== order loop (rider delivery) =="
$idempotencyKey = "smoke-$(Get-Date -Format 'yyyyMMddHHmmss')"
$orderBody = @{
  merchantId       = 'seed-merchant-1'
  fulfillmentType  = 'RIDER_DELIVERY'
  addressId        = 'seed-address-1'
  items            = @(@{ skuId = 'seed-sku-1'; qty = 1 })
  idempotencyKey   = $idempotencyKey
}

$order = Invoke-Api POST '/orders' $studentHeaders $orderBody $idempotencyKey
$orderId = $order.id
if (-not $orderId) { throw 'create order missing id' }
Write-Host "created order $orderId"

$order2 = Invoke-Api POST '/orders' $studentHeaders $orderBody $idempotencyKey
if ($order2.id -ne $orderId) { throw 'idempotency failed: different order id' }
Write-Host "OK idempotency"

Invoke-Api POST "/orders/$orderId/payments" $studentHeaders @{ provider = 'MOCK' } | Out-Null
$paid = Invoke-Api GET "/orders/$orderId" $studentHeaders
if ($paid.status -notin @('merchant_pending', 'MERCHANT_PENDING')) {
  throw "expected merchant_pending after MOCK pay, got $($paid.status)"
}
Write-Host "OK MOCK payment -> $($paid.status)"

Invoke-Api POST "/merchant/orders/$orderId/accept" $merchantHeaders | Out-Null
Invoke-Api POST "/merchant/orders/$orderId/ready" $merchantHeaders | Out-Null
$ready = Invoke-Api GET "/orders/$orderId" $studentHeaders
if ($ready.status -notin @('ready', 'READY')) { throw "expected ready, got $($ready.status)" }
$pickupCode = $ready.pickupCode
$deliveryCode = $ready.deliveryCode
if (-not $pickupCode -or -not $deliveryCode) { throw 'missing pickup/delivery codes' }
Write-Host "OK merchant accept+ready codes=$pickupCode/$deliveryCode"

$opsHeaders = DevHeaders 'seed-user-ops' 'campus_ops'
Invoke-Api POST '/ops/dispatch/assign' $opsHeaders @{
  orderId = $orderId
  riderId = 'seed-user-rider'
} | Out-Null
Write-Host "OK dispatch assigned"

$riderHeaders = DevHeaders 'seed-user-rider' 'rider'
Invoke-Api POST '/rider/duty/on' $riderHeaders | Out-Null
Invoke-Api POST "/rider/tasks/$orderId/accept" $riderHeaders | Out-Null
Invoke-Api POST "/rider/tasks/$orderId/arrive-store" $riderHeaders | Out-Null
Invoke-Api POST "/rider/tasks/$orderId/pickup" $riderHeaders @{ pickupCode = $pickupCode } | Out-Null
Invoke-Api POST "/rider/tasks/$orderId/deliver" $riderHeaders @{ deliveryCode = $deliveryCode } | Out-Null

$done = Invoke-Api GET "/orders/$orderId" $studentHeaders
if ($done.status -notin @('completed', 'COMPLETED')) {
  throw "expected completed, got $($done.status)"
}

Write-Host ""
Write-Host "SMOKE PASSED order=$orderId status=$($done.status)"
