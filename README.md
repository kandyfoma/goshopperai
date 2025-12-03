# Invoice Intelligence (Prix Tracker)

> Smart invoice scanning and price comparison app for the Democratic Republic of Congo (DRC)

## 🎯 Product Overview

Invoice Intelligence helps consumers in the DRC track their spending and compare prices across stores by:
- **Scanning receipts** using AI-powered extraction
- **Tracking personal spending** with detailed reports
- **Comparing prices** against public store data
- **Saving money** by identifying the best deals

## 🏗️ Technology Stack

### Core Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Client** | React Native + Hermes | Cross-platform mobile app (optimized for low-end devices) |
| **AI Processing** | Gemini 2.5 Flash API | Receipt/invoice parsing to JSON |
| **Database** | Cloud Firestore + WatermelonDB | Real-time + offline-first data storage |
| **Authentication** | Firebase Auth | User identity management |
| **Payments** | Moko Afrika | Mobile Money subscriptions (M-Pesa, Orange Money, Airtel, AfriMoney) |
| **Storage** | Firebase Cloud Storage | Image and file storage |
| **Backend** | Firebase Cloud Functions | API proxy, webhooks, scheduled tasks |

### Optimizations for DRC Market

| Optimization | Technology | Benefit |
|--------------|------------|---------|
| **JS Engine** | Hermes | 53% faster startup, 33% smaller bundle |
| **Image Compression** | react-native-image-resizer | 90% data savings for users |
| **API Security** | Cloud Functions Proxy | Secure Gemini calls + rate limiting |
| **Offline Database** | WatermelonDB | Complex queries work offline |
| **Fallback OCR** | ML Kit | Basic scanning without internet |

## 📁 Documentation Structure

```
docs/
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md      # High-level system design
│   ├── COMPONENT_ARCHITECTURE.md   # Frontend component structure
│   ├── INFRASTRUCTURE.md           # Cloud infrastructure setup
│   ├── STACK_OPTIMIZATIONS.md      # Performance optimizations
│   └── DUAL_DATA_SOURCES.md        # Public vs private data model
├── data/
│   ├── DATA_MODELS.md              # Firestore schema definitions
│   ├── SECURITY_RULES.md           # Firebase security rules
│   └── DATA_FLOW.md                # Data pipeline documentation
├── api/
│   ├── GEMINI_INTEGRATION.md       # AI parsing specifications
│   ├── PAYMENT_INTEGRATION.md      # Mobile Money integration
│   └── API_CONTRACTS.md            # Internal API specifications
├── product/
│   ├── USER_FLOWS.md               # User journey documentation
│   ├── FEATURES.md                 # Feature specifications
│   ├── LONG_RECEIPTS.md            # Multi-photo capture handling
│   └── IMPROVEMENTS_ROADMAP.md     # Future enhancements
└── development/
    ├── SETUP.md                    # Development environment setup
    ├── CONTRIBUTING.md             # Contribution guidelines
    └── DEPLOYMENT.md               # Deployment procedures
```

## 🚀 Quick Links

- [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Data Models](./docs/data/DATA_MODELS.md)
- [User Flows](./docs/product/USER_FLOWS.md)
- [API Specifications](./docs/api/API_CONTRACTS.md)

## 📊 Core Features

### 1. Invoice Scanning (Private Data)
- Camera-based receipt capture
- AI-powered data extraction via Gemini
- User validation and correction
- Private storage for personal reports

### 2. Price Comparison (Public Data)
- Access to merchant-uploaded price data
- Best price indicators per item
- Store comparison views
- Personal price history overlay

### 3. Spending Reports
- Monthly spending summaries
- Category breakdowns
- Savings estimation
- Trend analysis

### 4. Subscription Management
- 5 free scans trial
- Mobile Money payment integration
- Subscription status tracking

## 🎯 Target Market

**Primary:** Democratic Republic of Congo (DRC)
**Users:** Cost-conscious consumers who want to track spending and find the best prices
**Language:** French (primary), English (secondary)

## 📱 Supported Platforms

- iOS (iPhone)
- Android
- Web (Progressive Web App)

## 📄 License

Proprietary - All rights reserved

---

*Documentation last updated: December 2025*
