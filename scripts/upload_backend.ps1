$success = $false
for ($i=0; $i -lt 5; $i++) { 
    Write-Host "Retrying SCP..."
    scp -r -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no backend/src/app.js backend/src/controllers/ root@202.155.157.13:/var/www/backend/src/
    if ($LASTEXITCODE -eq 0) { 
        $success = $true
        break 
    } 
    Start-Sleep -Seconds 2 
}
if (-not $success) { throw "SCP Failed after retries" }

$success2 = $false
for ($i=0; $i -lt 5; $i++) {
    Write-Host "Restarting PM2..."
    ssh -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "pm2 restart warkop-backend"
    if ($LASTEXITCODE -eq 0) {
        $success2 = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $success2) { throw "SSH Failed after retries" }
Write-Host "Done!"
