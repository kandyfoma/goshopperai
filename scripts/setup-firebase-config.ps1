# Firebase Cloud Functions - Environment Variables Setup
# Only variables actually used in your app

Write-Host "🔧 Setting up Firebase environment variables..." -ForegroundColor Cyan
Write-Host ""

# Navigate to functions directory
if (!(Test-Path "lib")) {
    cd functions
}

# ===============================================
# REQUIRED: Variables your app uses
# ===============================================
Write-Host "📝 Setting required variables..." -ForegroundColor Yellow
Write-Host ""

firebase functions:config:set `
  gemini.api_key="AIzaSyD_6TuBhIMvdyqskWlkmhJIL_DbiBoitlE"

Write-Host ""
Write-Host "✅ All required variables set!" -ForegroundColor Green
Write-Host ""

# ===============================================
# View configuration
# ===============================================
Write-Host "📋 Current Firebase configuration:" -ForegroundColor Cyan
firebase functions:config:get

Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Deploy functions: firebase deploy --only functions" -ForegroundColor White
Write-Host "2. Test receipt parsing to verify Gemini API works" -ForegroundColor White
Write-Host ""
Write-Host "ℹ️  NOTE:" -ForegroundColor Cyan
Write-Host "- Firebase project settings are auto-configured by GCP" -ForegroundColor White
Write-Host "- Payment variables (Moko, Stripe) not set - add when needed" -ForegroundColor White
Write-Host "- Supabase credentials are in React Native app .env only" -ForegroundColor White
Write-Host ""
