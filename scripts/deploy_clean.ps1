$ErrorActionPreference = 'Stop'

Write-Host "Building frontend..."
npm --prefix frontend run build
cp frontend/capacitor.config.json frontend/dist/
cd frontend/dist
tar -czf ../dist.tar.gz *
cd ../..

$filename = "frontend/dist.tar.gz"
Write-Host "Uploading $filename..."
$success = $false
for ($retry = 0; $retry -lt 5; $retry++) {
    scp -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no $filename root@202.155.157.13:/tmp/
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        break
    }
    Write-Host "Retry SCP..."
    Start-Sleep -Seconds 2
}
if (-not $success) { throw "Failed to upload" }

Write-Host "Deploying on server..."
$cmd = "mkdir -p /tmp/dist_extract && rm -rf /tmp/dist_extract/* && tar -xzf /tmp/dist.tar.gz -C /tmp/dist_extract && cd /tmp/dist_extract && rm -f /var/www/landing_page/bundle.zip && zip -r /var/www/landing_page/bundle.zip . -x '*.apk' && cp -R ./* /var/www/frontend/ && echo DEPLOY_OK"

ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 $cmd
Write-Host "Done!"
