#!/bin/bash
set -e

echo "=== Freeing disk space ==="
rm -rf ~/Library/Caches/Google 2>/dev/null && echo "Cleared Google cache"
rm -rf ~/Library/Caches/com.microsoft.VSCode.ShipIt 2>/dev/null && echo "Cleared VSCode cache"
rm -rf ~/Library/Caches/com.mongodb.compass.ShipIt 2>/dev/null && echo "Cleared MongoDB cache"
rm -rf ~/Library/Caches/puccinialin 2>/dev/null && echo "Cleared puccinialin"
rm -rf ~/Library/Caches/dotslash 2>/dev/null && echo "Cleared dotslash"
rm -rf ~/Library/Caches/net.whatsapp.WhatsApp 2>/dev/null && echo "Cleared WhatsApp cache"
rm -rf ~/Library/Caches/antigravity-updater 2>/dev/null && echo "Cleared updater cache"

df -h /Users/akshatverma

echo "=== Setting up Gradle on /Volumes/akshat ==="
mkdir -p /Volumes/akshat/.gradle

echo "=== Applying NDK fix ==="
sed -i '' 's/    ndkVersion rootProject.ext.ndkVersion/    \/\/ ndkVersion rootProject.ext.ndkVersion/' \
  /Volumes/akshat/Ashirwad_Internal_System/ashirwad-mobile/android/app/build.gradle

echo "=== Building APK ==="
export ANDROID_HOME=$HOME/Library/Android/sdk
export GRADLE_USER_HOME=/Volumes/akshat/.gradle
export JAVA_HOME=$(/usr/libexec/java_home)

cd /Volumes/akshat/Ashirwad_Internal_System/ashirwad-mobile/android
./gradlew assembleDebug

find /Volumes/akshat/Ashirwad_Internal_System/ashirwad-mobile/android/app/build/outputs/apk -name "*.apk" 2>/dev/null | xargs ls -lh 2>/dev/null || echo "APK not found"
