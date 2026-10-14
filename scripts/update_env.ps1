$success = $false
for ($i=0; $i -lt 5; $i++) {
    Write-Host "Updating APP_VERSION to 1.0.87 on VPS..."
    ssh -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "sed -i 's/APP_VERSION=.*/APP_VERSION=1.0.87/g' /var/www/backend/.env && pm2 restart warkop-backend --update-env"
    if ($LASTEXITCODE -eq 0) { 
        $success = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $success) { throw "SSH Failed after retries" }
Write-Host "Done!"
