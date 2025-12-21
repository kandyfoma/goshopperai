# Secret Configuration Setup

This file contains instructions for setting up secret credentials that are excluded from version control for security.

## Required Files

### 1. strings.xml
Copy `android/app/src/main/res/values/strings.xml.example` to `android/app/src/main/res/values/strings.xml` and update:

- Replace `YOUR_FACEBOOK_APP_ID` with your actual Facebook App ID
- Replace `YOUR_FACEBOOK_CLIENT_TOKEN` with your Facebook Client Token  
- Replace `fbYOUR_FACEBOOK_APP_ID` with `fb` + your actual Facebook App ID

### 2. google-services.json
Copy `android/app/google-services.json.example` to `android/app/google-services.json` and update:

- Replace all placeholder values with actual Firebase configuration
- Get this file from Firebase Console > Project Settings > General > Your apps

## Security Notes

- Never commit actual secret values to version control
- Use example files as templates 
- Keep actual credential files local only
- Add sensitive files to .gitignore

## Facebook Credentials

Get your Facebook credentials from:
- Facebook Developers Console: https://developers.facebook.com/
- Your App Dashboard > Basic Settings

## Firebase/Google Credentials  

Get your Firebase credentials from:
- Firebase Console: https://console.firebase.google.com/
- Project Settings > General > Your apps > Download google-services.json