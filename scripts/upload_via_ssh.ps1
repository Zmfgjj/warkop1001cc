param()
$zipPath = "frontend\dist_upload.zip"
$bytes = [System.IO.File]::ReadAllBytes($zipPath)
$b64 = [Convert]::ToBase64String($bytes)
Write-Host "File: $($bytes.Length) bytes, B64: $($b64.Length) chars"

$chunkSize = 60000
$total = [Math]::Ceiling($b64.Length / $chunkSize)
Write-Host "Total chunks: $total"

for ($i = 0; $i -lt $total; $i++) {
    $start = $i * $chunkSize
    $end = [Math]::Min($start + $chunkSize, $b64.Length)
    $chunk = $b64.Substring($start, $end - $start)
    
    if ($i -eq 0) {
        $cmd = "printf '%s' '$chunk' > /tmp/dist_b64"
    } else {
        $cmd = "printf '%s' '$chunk' >> /tmp/dist_b64"
    }
    
    $result = ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 $cmd
    Write-Host "Chunk $($i+1)/$total sent"
}

Write-Host "All chunks sent. Decoding on server..."
ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@202.155.157.13 "base64 -d /tmp/dist_b64 > /tmp/dist_upload.zip && ls -lh /tmp/dist_upload.zip"
Write-Host "Done!"
