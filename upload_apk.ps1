$source = 'C:\Users\jerem\OneDrive\Documents\VSC\KP\frontend\android\app\build\outputs\apk\debug\app-debug.apk'
$dest = '/root/warkop.apk'
$server = 'root@202.155.157.13'
$chunkSize = 2MB
$sshOpts = '-o ConnectTimeout=10 -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'

Write-Host 'Split and upload...'
$bytes = [IO.File]::ReadAllBytes($source)
$totalChunks = [Math]::Ceiling($bytes.Length / $chunkSize)
ssh $sshOpts.Split(' ') $server "rm -f $dest"

for ($i = 0; $i -lt $totalChunks; $i++) {
    Write-Host "Uploading chunk $i / $totalChunks"
    $start = $i * $chunkSize
    $end = [Math]::Min($start + $chunkSize, $bytes.Length)
    $chunk = $bytes[$start..($end - 1)]
    $tmp = "chunk_$i.bin"
    [IO.File]::WriteAllBytes($tmp, $chunk)
    
    $success = $false
    while (-not $success) {
        try {
            scp $sshOpts.Split(' ') $tmp "${server}:${dest}.part"
            if ($LASTEXITCODE -eq 0) {
                $success = $true
            } else {
                Write-Host "Retrying chunk $i..."
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host "Retrying chunk $i (exception)..."
            Start-Sleep -Seconds 2
        }
    }
    
    ssh $sshOpts.Split(' ') $server "cat $dest.part >> $dest && rm $dest.part"
    Remove-Item $tmp
}
Write-Host 'Deploying on server...'
ssh $sshOpts.Split(' ') $server "cp /root/warkop.apk /var/www/landing_page/warkop.apk && cp /root/warkop.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"
Write-Host 'Done!'
