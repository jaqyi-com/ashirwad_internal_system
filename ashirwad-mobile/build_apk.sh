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

echo "=== Building APK ==="
export ANDROID_HOME=$HOME/Library/Android/sdk
export GRADLE_USER_HOME=/Volumes/akshat/.gradle
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

cd /Volumes/akshat/Ashirwad_Internal_System/ashirwad-mobile/android
./gradlew assembleRelease

APK_PATH="/Volumes/akshat/Ashirwad_Internal_System/ashirwad-mobile/android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  cp "$APK_PATH" /Volumes/akshat/Ashirwad_Internal_System/client/public/ashirwad-ims.apk
  echo "✅ Copied APK to client/public/ashirwad-ims.apk"
  ls -lh /Volumes/akshat/Ashirwad_Internal_System/client/public/ashirwad-ims.apk
fi
