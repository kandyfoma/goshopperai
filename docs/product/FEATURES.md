# Features Specification

## Overview

This document provides detailed specifications for each feature in Invoice Intelligence, including acceptance criteria, edge cases, and implementation notes.

---

## Feature 1: Invoice Scanning

### Description
Users can capture photos of receipts/invoices and have them automatically parsed into structured data using AI.

### User Stories
- As a user, I want to take a photo of my receipt so that I don't have to manually enter the data.
- As a user, I want to review and edit the extracted data before saving.
- As a user, I want to pick an image from my gallery if I've already taken a photo.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| SC-1 | Camera opens when user taps "Scan" button | Must |
| SC-2 | User can toggle flash on/off/auto | Should |
| SC-3 | User can select image from device gallery | Must |
| SC-4 | Image is sent to Gemini API for parsing | Must |
| SC-5 | Loading state shown during processing (2-5 sec) | Must |
| SC-6 | Extracted data shown on validation screen | Must |
| SC-7 | All fields (store, date, items, prices) are editable | Must |
| SC-8 | User can add new items manually | Must |
| SC-9 | User can delete items | Must |
| SC-10 | Total auto-calculates from item totals | Must |
| SC-11 | Invoice saved to Firestore on confirmation | Must |
| SC-12 | Success confirmation shown after save | Must |
| SC-13 | Trial scan count decremented (if not subscribed) | Must |
| SC-14 | Error shown if parsing fails with retry option | Must |

### Technical Notes
- Image resized to max 1024x1536 before API call
- Base64 encoding for Gemini API
- Timeout: 30 seconds for API call
- Retry logic: 2 additional attempts on failure

### Edge Cases
| Case | Handling |
|------|----------|
| Blurry image | Show "Image quality too low" error with tips |
| Receipt in different language | Gemini handles multi-language; normalize output |
| Handwritten receipt | Attempt parsing; lower confidence expected |
| Very long receipt | Support scrolling; no item limit |
| No items detected | Allow manual entry fallback |
| Offline | Block scan; show offline message |
| Trial exhausted | Show paywall before camera opens |

---

## Feature 2: Price Comparison

### Description
Users can compare prices of items across different stores using public price data uploaded by merchants.

### User Stories
- As a user, I want to search for an item to see prices at different stores.
- As a user, I want to see which store has the best price.
- As a user, I want to see my own purchase history for comparison.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| PC-1 | List view shows all items with prices | Must |
| PC-2 | Search bar filters items by name | Must |
| PC-3 | Category filter chips available | Should |
| PC-4 | Each item shows best price prominently | Must |
| PC-5 | Price range (min-max) displayed | Should |
| PC-6 | Tapping item opens detail view | Must |
| PC-7 | Detail view shows all store prices | Must |
| PC-8 | Detail view shows user's purchase history | Should |
| PC-9 | Prices sorted by lowest first | Must |
| PC-10 | Store name and update date shown | Must |
| PC-11 | Pull-to-refresh updates data | Should |
| PC-12 | Offline mode shows cached data | Should |

### Technical Notes
- Firestore query with `where('itemNameNormalized', '==', normalized)`
- Real-time listener for price updates
- Local caching with Firestore persistence
- Item name normalization: lowercase, remove special chars

### Data Requirements
- Public price data must be available
- Minimum 3 stores for meaningful comparison
- Prices updated at least monthly

---

## Feature 3: Spending Reports (Dashboard)

### Description
Users can view summaries and visualizations of their spending based on scanned invoices.

### User Stories
- As a user, I want to see how much I spent this month.
- As a user, I want to see spending broken down by category.
- As a user, I want to see my estimated savings.
- As a user, I want to view my invoice history.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| DR-1 | Monthly total spending displayed prominently | Must |
| DR-2 | Comparison to previous month (% change) | Should |
| DR-3 | Estimated savings amount shown | Should |
| DR-4 | Invoice count displayed | Must |
| DR-5 | Category breakdown pie chart | Must |
| DR-6 | Category list with amounts | Must |
| DR-7 | Recent invoices list (last 5) | Must |
| DR-8 | "See All" navigates to full invoice list | Must |
| DR-9 | Date range selector (this month, last month, custom) | Should |
| DR-10 | Invoice detail view accessible | Must |
| DR-11 | Delete invoice option | Should |

### Calculations

**Monthly Total:**
```
monthlyTotal = SUM(invoice.total) WHERE invoice.date IN currentMonth
```

**Estimated Savings:**
```
estimatedSavings = SUM(
  FOR each item in user invoices:
    (item.price - bestPublicPrice) * quantity
  IF item.price > bestPublicPrice
)
```

**Category Breakdown:**
```
categoryTotals = GROUP BY item.category, SUM(item.totalPrice)
```

### Technical Notes
- Queries limited to user's private invoices
- Calculations done client-side for small datasets
- Consider Cloud Functions for large datasets
- Charts rendered with react-native-chart-kit

---

## Feature 4: Subscription & Payments

### Description
Users start with a free trial (5 scans) and can upgrade to unlimited access via Mobile Money payment.

### User Stories
- As a user, I want to try the app for free before paying.
- As a user, I want to pay with my Mobile Money account.
- As a user, I want to know how many free scans I have left.
- As a user, I want to manage my subscription.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| SB-1 | New users get 5 free scans | Must |
| SB-2 | Trial counter visible in UI | Must |
| SB-3 | Paywall appears when trial exhausted | Must |
| SB-4 | Monthly plan option ($2.99) | Must |
| SB-5 | Yearly plan option ($24.99, 30% off) | Must |
| SB-6 | Mobile Money providers selectable (M-Pesa, Orange, Airtel, AfriMoney) | Must |
| SB-7 | Phone number input for payment | Must |
| SB-8 | Payment initiated via Moko Afrika | Must |
| SB-9 | Success screen after payment | Must |
| SB-10 | Subscription status updated in real-time | Must |
| SB-11 | Subscription end date visible | Must |
| SB-12 | Expired subscription blocks scans | Must |
| SB-13 | "Restore Purchase" option available | Should |

### Business Rules

| Rule | Description |
|------|-------------|
| Trial Limit | 5 scans, non-renewable |
| Subscription Duration | Monthly: 30 days, Yearly: 365 days |
| Grace Period | None; immediate expiry |
| Refunds | Via Moko Afrika merchant dashboard |
| Currency | USD primary, CDF displayed |

### Payment Flow States
```
1. IDLE → User not in payment flow
2. SELECTING → User choosing plan
3. ENTERING_PHONE → User entering phone number
4. PROCESSING → Payment request sent
5. AWAITING_CONFIRMATION → User confirming on phone
6. SUCCESS → Payment complete
7. FAILED → Payment failed
8. CANCELLED → User cancelled
```

---

## Feature 5: Authentication

### Description
Users are authenticated anonymously to enable data persistence without requiring account creation.

### User Stories
- As a user, I want to use the app without creating an account.
- As a user, I want my data to persist across sessions.
- As a user, I want the option to upgrade to a full account later.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| AU-1 | Anonymous sign-in happens automatically on first launch | Must |
| AU-2 | User ID persisted across app sessions | Must |
| AU-3 | Data associated with anonymous user | Must |
| AU-4 | Option to link email/password (in Settings) | Should |
| AU-5 | Sign out clears local data (with warning) | Should |

### Technical Notes
- Firebase Auth anonymous provider
- UID stored in secure storage
- Can link to email/password later
- If user deletes app, new anonymous account created (data lost)

### Data Migration
When upgrading from anonymous to email account:
1. Link credentials to existing UID
2. All data remains associated
3. No data migration needed

---

## Feature 6: Offline Support

### Description
Core features work offline with data syncing when connection is restored.

### User Stories
- As a user, I want to view my invoices when offline.
- As a user, I want to see cached price data when offline.
- As a user, I want to know when I'm offline.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| OF-1 | Offline indicator shown when no connection | Must |
| OF-2 | Saved invoices viewable offline | Must |
| OF-3 | Cached price data viewable offline | Should |
| OF-4 | Scanning blocked offline (requires AI) | Must |
| OF-5 | Clear message explaining offline limitations | Must |
| OF-6 | Auto-sync when connection restored | Must |

### Technical Notes
- Firestore offline persistence enabled by default
- Network status checked before scan
- Graceful degradation messaging

---

## Feature 7: Multi-Language Support

### Description
App supports French (primary) and English for the DRC market.

### User Stories
- As a French-speaking user, I want the app in French.
- As an English-speaking user, I want the option to use English.

### Acceptance Criteria

| ID | Criteria | Priority |
|----|----------|----------|
| ML-1 | Default language is French | Must |
| ML-2 | Language selector in Settings | Should |
| ML-3 | All UI text translatable | Must |
| ML-4 | Receipt parsing works in both languages | Must |
| ML-5 | Currency formatting respects locale | Should |

### Supported Languages
| Code | Language | Status |
|------|----------|--------|
| `fr` | French | Primary |
| `en` | English | Secondary |

---

## Feature Priority Matrix

| Feature | Priority | MVP | Phase 2 | Phase 3 |
|---------|----------|-----|---------|---------|
| Invoice Scanning | P0 | ✓ | | |
| Validation/Editing | P0 | ✓ | | |
| Private Invoice Storage | P0 | ✓ | | |
| Anonymous Auth | P0 | ✓ | | |
| Trial Tracking | P0 | ✓ | | |
| Paywall | P0 | ✓ | | |
| Mobile Money Payment | P0 | ✓ | | |
| Price Comparison (Basic) | P1 | ✓ | | |
| Dashboard/Reports | P1 | ✓ | | |
| Offline Viewing | P1 | | ✓ | |
| French Localization | P1 | ✓ | | |
| Category Breakdown | P2 | | ✓ | |
| Price History Charts | P2 | | ✓ | |
| Export Data | P2 | | | ✓ |
| Price Alerts | P3 | | | ✓ |
| Shopping Lists | P3 | | | ✓ |
| Account Upgrade | P3 | | | ✓ |

---

## Non-Functional Requirements

### Performance
| Metric | Target |
|--------|--------|
| App launch time | < 3 seconds |
| Scan processing | < 5 seconds |
| Screen navigation | < 300ms |
| API response (cached) | < 100ms |

### Security
- All data in transit encrypted (HTTPS)
- Firebase Security Rules enforced
- API keys restricted by app signature
- No PII stored beyond what user provides

### Accessibility
- Minimum touch target: 44x44 points
- Color contrast ratio: 4.5:1 minimum
- Screen reader compatible labels
- Support for system font scaling

### Device Support
| Platform | Minimum Version |
|----------|-----------------|
| Android | 8.0 (API 26) |
| iOS | 13.0 |
| Web | Modern browsers |

---

*Next: [Development Setup](../development/SETUP.md)*
