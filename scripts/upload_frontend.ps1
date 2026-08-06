$maxRetries = 10
$retryDelay = 5

for ($i = 0; $i -lt $maxRetries; $i++) {
    Write-Host "Attempt $($i + 1) to upload frontend..."
    
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@202.155.157.13 "rm -rf /var/www/frontend/assets/*"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SSH failed, retrying in $retryDelay seconds..."
        Start-Sleep -Seconds $retryDelay
        continue
    }

    scp -r -o ConnectTimeout=15 -o StrictHostKeyChecking=no frontend/dist/* root@202.155.157.13:/var/www/frontend/
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SCP (frontend) failed, retrying in $retryDelay seconds..."
        Start-Sleep -Seconds $retryDelay
        continue
    }
    
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@202.155.157.13 "rm -rf /var/www/landing_page/*"
    scp -r -o ConnectTimeout=15 -o StrictHostKeyChecking=no frontend/dist/* root@202.155.157.13:/var/www/landing_page/
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SCP (landing_page) failed, retrying in $retryDelay seconds..."
        Start-Sleep -Seconds $retryDelay
        continue
    }
    
    Write-Host "Upload Frontend Success!"
    
    # Bundle ZIP for OTA (OTA rule!)
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@202.155.157.13 "cd /var/www/frontend && cp capacitor.config.json ./ || true && zip -r /var/www/landing_page/bundle.zip . -x '*.apk'"
    
    Write-Host "Bundle ZIP for OTA updated!"
    exit 0
}
Write-Host "Failed after $maxRetries attempts."
exit 1
