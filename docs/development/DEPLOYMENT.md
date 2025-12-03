# Deployment Guide

## Overview

This guide covers the deployment process for Invoice Intelligence across all platforms and environments.

---

## Environments

| Environment | Purpose | Firebase Project | Payment Mode |
|-------------|---------|------------------|--------------|
| Development | Local development | `invoice-intelligence-dev` | Test |
| Staging | Pre-production testing | `invoice-intelligence-staging` | Test |
| Production | Live users | `invoice-intelligence-drc` | Live |

---

## Firebase Deployment

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project invoice-intelligence-drc

# Deploy Storage rules
firebase deploy --only storage:rules --project invoice-intelligence-drc
```

### Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions --project invoice-intelligence-drc

# Deploy specific function
firebase deploy --only functions:handlePaymentWebhook --project invoice-intelligence-drc
```

### Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes --project invoice-intelligence-drc
```

### Full Firebase Deployment

```bash
# Deploy everything
firebase deploy --project invoice-intelligence-drc
```

---

## Mobile App Deployment

### Android (Google Play Store)

#### Prerequisites

1. Google Play Developer account ($25 one-time)
2. Keystore for signing (`upload-keystore.jks`)
3. Service account for automated uploads

#### Build Release APK

```bash
# Navigate to android folder
cd android

# Generate release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### Build Release AAB (Recommended)

```bash
# Generate release bundle
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

#### Signing Configuration

```groovy
// android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file('upload-keystore.jks')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS')
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Upload to Play Store

**Manual:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select app → Release → Production
3. Create new release
4. Upload AAB file
5. Add release notes
6. Review and rollout

**Automated (GitHub Actions):**
```yaml
# .github/workflows/android-release.yml
name: Android Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android Release
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew bundleRelease
      
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          packageName: com.invoiceintelligence.app
          releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
          track: production
          status: completed
```

### iOS (App Store)

#### Prerequisites

1. Apple Developer account ($99/year)
2. App Store Connect app created
3. Signing certificates and provisioning profiles

#### Build Archive

```bash
# Install pods
cd ios && pod install && cd ..

# Open in Xcode
open ios/InvoiceIntelligence.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Window → Organizer
# 4. Distribute App → App Store Connect
```

#### Fastlane Setup (Recommended)

```bash
# Install Fastlane
gem install fastlane

# Initialize
cd ios
fastlane init
```

```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new release build to TestFlight"
  lane :beta do
    increment_build_number
    build_app(
      workspace: "InvoiceIntelligence.xcworkspace",
      scheme: "InvoiceIntelligence",
      export_method: "app-store"
    )
    upload_to_testflight
  end

  desc "Push a new release to App Store"
  lane :release do
    increment_build_number
    build_app(
      workspace: "InvoiceIntelligence.xcworkspace",
      scheme: "InvoiceIntelligence",
      export_method: "app-store"
    )
    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: false
    )
  end
end
```

**Deploy:**
```bash
cd ios
fastlane beta    # TestFlight
fastlane release # App Store
```

---

## Web Deployment (PWA)

### Build for Production

```bash
# Build web version
npm run build:web

# Output: web-build/
```

### Deploy to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting --project invoice-intelligence-drc
```

### Automated Deployment

```yaml
# .github/workflows/web-deploy.yml
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build:web
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... other env vars
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: invoice-intelligence-drc
```

---

## Environment Variables Management

### Local Development

```bash
# Use .env files
.env.development
.env.staging
.env.production
```

### CI/CD (GitHub Secrets)

Required secrets:
```
FIREBASE_API_KEY
FIREBASE_PROJECT_ID
GEMINI_API_KEY
MOKO_API_KEY
MOKO_SECRET_KEY
KEYSTORE_PASSWORD (Android)
KEY_ALIAS (Android)
KEY_PASSWORD (Android)
PLAY_STORE_SERVICE_ACCOUNT (Android)
FIREBASE_SERVICE_ACCOUNT
APPLE_ID (iOS)
APP_STORE_CONNECT_API_KEY (iOS)
```

### Firebase Functions Config

```bash
# Set config for Cloud Functions
firebase functions:config:set \
  moko.api_key="your_moko_api_key" \
  moko.secret_key="your_moko_secret_key" \
  moko.api_url="https://api.mokoafrika.com/v1" \
  moko.webhook_secret="your_webhook_secret" \
  gemini.api_key="your_gemini_key" \
  --project invoice-intelligence-drc
```

---

## Versioning

### Version Bump Script

```json
// package.json
{
  "scripts": {
    "version:patch": "npm version patch && cd ios && agvtool bump -all && cd ../android && ./gradlew versionPatch",
    "version:minor": "npm version minor && cd ios && agvtool bump -all && cd ../android && ./gradlew versionMinor",
    "version:major": "npm version major && cd ios && agvtool bump -all && cd ../android && ./gradlew versionMajor"
  }
}
```

### Release Tags

```bash
# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0
```

---

## Monitoring Post-Deployment

### Firebase Console Checks

- [ ] Authentication: Users can sign in
- [ ] Firestore: Data reads/writes working
- [ ] Functions: No errors in logs
- [ ] Crashlytics: No new crash spikes

### App Checks

- [ ] App launches successfully
- [ ] Invoice scanning works
- [ ] Payment flow completes
- [ ] Offline mode works
- [ ] Push notifications arrive (if applicable)

### Rollback Procedure

**Firebase Functions:**
```bash
# List previous versions
firebase functions:list

# Roll back (redeploy previous version)
git checkout <previous-commit>
firebase deploy --only functions
```

**Android:**
1. Go to Play Console
2. Release Management → App Releases
3. Halt rollout
4. Create new release with previous APK

**iOS:**
1. Go to App Store Connect
2. Remove from sale (if critical)
3. Submit new version with fix

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No TypeScript/ESLint errors
- [ ] Environment variables set
- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] Release notes prepared

### Deploy Firebase

- [ ] Security rules deployed
- [ ] Functions deployed
- [ ] Indexes deployed
- [ ] Config secrets set

### Deploy Mobile

- [ ] Android AAB built and signed
- [ ] iOS archive built and signed
- [ ] Screenshots updated (if UI changed)
- [ ] Store listing updated
- [ ] Submitted for review

### Post-Deployment

- [ ] Smoke test on production
- [ ] Monitor error rates
- [ ] Monitor crash reports
- [ ] Check analytics events
- [ ] Announce release (if public)

---

## Disaster Recovery

### Database Backup

```bash
# Export Firestore data
gcloud firestore export gs://invoice-intelligence-backups/$(date +%Y%m%d)

# Import Firestore data
gcloud firestore import gs://invoice-intelligence-backups/20251201
```

### Emergency Contacts

| Role | Contact |
|------|---------|
| Firebase Issues | Firebase Support |
| Payment Issues | Moko Afrika: +243 898 900 066 / info@mokoafrika.com |
| Play Store Issues | Google Play Console |
| App Store Issues | Apple Developer Support |

---

*For development setup, see [SETUP.md](./SETUP.md)*
