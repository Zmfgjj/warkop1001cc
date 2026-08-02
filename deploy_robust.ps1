$ErrorActionPreference = 'Stop'

Write-Host "Building frontend..."
cd frontend
npm run build
cp capacitor.config.json dist/
cd dist
tar -cf ../dist.tar *
cd ..
Compress-Archive -Path dist/* -DestinationPath dist_upload.zip -Force

Write-Host "Splitting zip into chunks..."
$bytes = [System.IO.File]::ReadAllBytes("dist_upload.zip")
$chunkSize = 250000
$totalChunks = [Math]::Ceiling($bytes.Length / $chunkSize)

# Clean old chunks
if (Test-Path "chunk_*.bin") { Remove-Item "chunk_*.bin" }

for ($i = 0; $i -lt $totalChunks; $i++) {
    $size = [Math]::Min($chunkSize, $bytes.Length - ($i * $chunkSize))
    $chunk = New-Object byte[] $size
    [System.Array]::Copy($bytes, $i * $chunkSize, $chunk, 0, $size)
    $filename = "chunk_$($i).bin"
    [System.IO.File]::WriteAllBytes($filename, $chunk)
    
    Write-Host "Uploading $filename..."
    $success = $false
    for ($retry = 0; $retry -lt 5; $retry++) {
        scp -o ConnectTimeout=10 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no $filename root@202.155.157.13:/tmp/
        if ($LASTEXITCODE -eq 0) {
            $success = $true
            break
        }
        Write-Host "Retry SCP $filename..."
        Start-Sleep -Seconds 2
    }
    if (-not $success) { throw "Failed to upload $filename" }
}

Write-Host "Joining chunks on server and deploying..."
$joinCmd = "cd /tmp && cat chunk_*.bin > dist_upload.zip && cd /var/www/frontend && rm -rf * && unzip -o /tmp/dist_upload.zip && rm -f /var/www/landing_page/bundle.zip && zip -r /var/www/landing_page/bundle.zip . -x '*.apk' -x '*.zip' -x '*.tar' && rm -f /tmp/chunk_*.bin && echo DEPLOY_OK"

ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 $joinCmd
Write-Host "Done!"
