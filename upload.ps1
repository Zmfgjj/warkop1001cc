$ErrorActionPreference = 'Stop'

Write-Host "Zipping dist folder..."
Copy-Item "frontend/capacitor.config.json" -Destination "frontend/dist/" -Force
Set-Location "frontend/dist"
tar -czf ../dist.tar.gz *
Set-Location "../../"

$success = $false
for ($i=0; $i -lt 10; $i++) { 
    Write-Host "Retrying SCP..."
    scp -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no frontend/dist.tar.gz root@202.155.157.13:/tmp/dist.tar.gz
    if ($LASTEXITCODE -eq 0) { 
        $success = $true
        break 
    } 
    Start-Sleep -Seconds 2 
}
if (-not $success) { throw "SCP Failed after retries" }

Write-Host "Deploying on server..."
$cmd = "mkdir -p /tmp/dist_extract && rm -rf /tmp/dist_extract/* && tar -xzf /tmp/dist.tar.gz -C /tmp/dist_extract && cd /tmp/dist_extract && rm -f /var/www/landing_page/bundle.zip && zip -r /var/www/landing_page/bundle.zip . -x '*.apk' && cp -R ./* /var/www/frontend/ && echo DEPLOY_OK"

ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 $cmd
Write-Host "Done!"
