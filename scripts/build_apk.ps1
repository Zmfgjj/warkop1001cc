cd frontend
npx cap sync android
cd android
.\gradlew assembleDebug
cd ..\..
Copy-Item frontend\android\app\build\outputs\apk\debug\app-debug.apk -Destination warkop-pos.apk -Force
scp -o StrictHostKeyChecking=no warkop-pos.apk root@202.155.157.13:/root/warkop.apk
ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /root/warkop.apk /var/www/landing_page/warkop.apk && cp /root/warkop.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"
Write-Host "Done Deploying APK!"
