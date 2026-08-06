$success = $false
for ($i=0; $i -lt 5; $i++) {
    Write-Host "Updating env..."
    ssh -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "sed -i 's/1.0.35/1.0.36/g' /var/www/backend/.env"
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $success) { throw "SSH Failed after retries" }
Write-Host "Done!"
