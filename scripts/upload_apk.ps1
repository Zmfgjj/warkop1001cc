$max_retries = 5
$retry_count = 0
$success = $false

while (-not $success -and $retry_count -lt $max_retries) {
    $retry_count++
    Write-Host "Attempt $retry_count to upload APK..."
    
    # Run scp and capture exit code
    scp -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no warkop-pos.apk root@202.155.157.13:/root/warkop.apk
    if ($LASTEXITCODE -eq 0) {
        ssh -o ConnectTimeout=15 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "cp /root/warkop.apk /var/www/landing_page/warkop.apk && cp /root/warkop.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"
        if ($LASTEXITCODE -eq 0) {
            $success = $true
            Write-Host "Upload APK Success!"
        } else {
            Write-Host "SSH command failed. Retrying..."
        }
    } else {
        Write-Host "SCP failed. Retrying..."
    }

    if (-not $success) {
        Start-Sleep -Seconds 5
    }
}

if (-not $success) {
    Write-Host "Failed to upload APK after $max_retries attempts."
    exit 1
}
