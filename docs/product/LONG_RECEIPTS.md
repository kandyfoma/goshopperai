# Long Receipt Handling

## The Problem

Receipts can be very long, especially from supermarkets with 20+ items. A standard phone camera view cannot capture the entire receipt in one photo.

**Challenges:**
- Receipt is longer than camera frame
- Multiple photos may overlap or miss items
- AI needs clear, readable images
- User experience should remain simple

---

## Solutions Overview

| Approach | Pros | Cons | Recommended For |
|----------|------|------|-----------------|
| **Multi-Photo Capture** | Simple, reliable | User effort, merge logic | MVP |
| **Scroll Capture** | Single action | Complex, may blur | Future |
| **Partial + Manual** | Flexible | More user work | Fallback |
| **Folded Capture** | Works for long receipts | Quality issues | Not recommended |

---

## Recommended Solution: Multi-Photo Capture

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-PHOTO CAPTURE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

    LONG RECEIPT                     USER CAPTURES                SYSTEM MERGES
    ────────────                     ─────────────                ────────────
                                     
    ┌─────────┐                      ┌─────────┐
    │ Header  │  ◄── Photo 1 ───►   │ Photo 1 │
    │ Item 1  │                      │   ✓     │
    │ Item 2  │                      └─────────┘
    │ Item 3  │                           │
    ├─────────┤                           │           ┌─────────────────────┐
    │ Item 4  │                      ┌─────────┐      │    MERGED RESULT    │
    │ Item 5  │  ◄── Photo 2 ───►   │ Photo 2 │      │                     │
    │ Item 6  │                      │   ✓     │  ──► │  • Store: Shoprite  │
    │ Item 7  │                      └─────────┘      │  • Date: Dec 1      │
    ├─────────┤                           │           │  • 12 items found   │
    │ Item 8  │                      ┌─────────┐      │  • Total: $85.50    │
    │ Item 9  │  ◄── Photo 3 ───►   │ Photo 3 │      │                     │
    │ Total   │                      │   ✓     │      └─────────────────────┘
    │ Footer  │                      └─────────┘
    └─────────┘
```

### User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Start      │────▶│  Capture    │────▶│  Add More?  │────▶│  Process    │
│  Long Scan  │     │  Section    │     │  [Yes/Done] │     │  All Photos │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           ▲                   │
                           └───────────────────┘
                              (if "Add More")
```

### Screen Designs

#### Camera Screen (Multi-Photo Mode)

```
┌────────────────────────┐
│ [←]    Long Receipt    │
│                        │
│   Photos: 1 of ?       │
│   ┌────────────────┐   │
│   │                │   │
│   │   Capture the  │   │
│   │   TOP section  │   │
│   │   of receipt   │   │
│   │                │   │
│   │  ┌──────────┐  │   │
│   │  │ overlap  │  │   │  <- Guide overlay
│   │  │ zone     │  │   │
│   │  └──────────┘  │   │
│   └────────────────┘   │
│                        │
│   Include some overlap │
│   with previous photo  │
│                        │
│       [ 📷 ]           │
│                        │
└────────────────────────┘
```

#### Photo Review (After Each Capture)

```
┌────────────────────────┐
│ [←]      Photo 2       │
│                        │
│   ┌────────────────┐   │
│   │                │   │
│   │   [Thumbnail   │   │
│   │    of photo]   │   │
│   │                │   │
│   └────────────────┘   │
│                        │
│   ┌─────────────────┐  │
│   │ Photo 1 ✓       │  │  <- Previous photos
│   │ Photo 2 ✓ (new) │  │
│   └─────────────────┘  │
│                        │
│  Is there more receipt │
│  to capture?           │
│                        │
│ [+ Add More]  [Done ✓] │
│                        │
│   [Retake Photo 2]     │
│                        │
└────────────────────────┘
```

#### Processing (All Photos)

```
┌────────────────────────┐
│                        │
│   Processing 3 photos  │
│                        │
│   ┌───┐ ┌───┐ ┌───┐   │
│   │ 1 │ │ 2 │ │ 3 │   │  <- Thumbnails
│   │ ✓ │ │ ⟳ │ │ ○ │   │
│   └───┘ └───┘ └───┘   │
│                        │
│   Analyzing section 2  │
│   of 3...              │
│                        │
│   ████████░░░░  67%    │
│                        │
│                        │
│      [Cancel]          │
│                        │
└────────────────────────┘
```

### Technical Implementation

#### Data Structure

```typescript
interface MultiPhotoScan {
  scanId: string;
  photos: ScanPhoto[];
  status: 'capturing' | 'processing' | 'complete' | 'failed';
  mergedResult?: ParsedInvoice;
}

interface ScanPhoto {
  photoId: string;
  imageUri: string;
  imageBase64?: string;
  order: number;              // 1, 2, 3...
  status: 'pending' | 'processing' | 'parsed' | 'failed';
  parsedData?: Partial<ParsedInvoice>;
}
```

#### Processing Algorithm

```typescript
async function processMultiPhotoScan(photos: ScanPhoto[]): Promise<ParsedInvoice> {
  // Step 1: Parse each photo individually
  const parsedPhotos = await Promise.all(
    photos.map(photo => geminiClient.parseInvoice(photo.imageBase64))
  );
  
  // Step 2: Extract header info from first photo
  const headerInfo = extractHeader(parsedPhotos[0]);
  
  // Step 3: Merge all items, removing duplicates
  const allItems = mergeItems(parsedPhotos);
  
  // Step 4: Get total from last photo (usually contains total)
  const totalInfo = extractTotal(parsedPhotos[parsedPhotos.length - 1]);
  
  // Step 5: Validate totals match
  const calculatedTotal = allItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  return {
    shopName: headerInfo.shopName,
    shopAddress: headerInfo.shopAddress,
    date: headerInfo.date,
    items: allItems,
    total: totalInfo.total || calculatedTotal,
    currency: headerInfo.currency || 'USD',
  };
}

function mergeItems(parsedPhotos: ParseResult[]): ParsedItem[] {
  const allItems: ParsedItem[] = [];
  const seenItems = new Set<string>();
  
  for (const photo of parsedPhotos) {
    if (!photo.data?.items) continue;
    
    for (const item of photo.data.items) {
      // Create unique key for deduplication
      const key = normalizeForComparison(item.name) + '_' + item.totalPrice;
      
      if (!seenItems.has(key)) {
        seenItems.add(key);
        allItems.push(item);
      }
    }
  }
  
  return allItems;
}

function normalizeForComparison(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');
}
```

#### Gemini Prompt for Multi-Photo

```typescript
const MULTI_PHOTO_PROMPT = `
You are analyzing ONE SECTION of a longer receipt. 
This may be the top, middle, or bottom section.

Extract ALL visible items and information. Include:
- Store name and address (if visible - usually at top)
- Date (if visible - usually at top)  
- All line items with names, quantities, prices
- Subtotal, tax, total (if visible - usually at bottom)

Return JSON with these fields (use null if not visible in this section):
{
  "shopName": "string or null",
  "shopAddress": "string or null",
  "date": "string YYYY-MM-DD or null",
  "items": [...],
  "subtotal": "number or null",
  "tax": "number or null",
  "total": "number or null"
}

IMPORTANT: Extract every item you can see, even partial ones at edges.
`;
```

---

## Alternative: Guided Scroll Capture (Future)

### Concept

User slowly scrolls phone down the receipt while recording. App extracts frames and stitches them together.

```
┌────────────────────────┐
│ [←]    Scroll Mode     │
│                        │
│   Hold phone steady    │
│   and scroll DOWN      │
│   slowly               │
│                        │
│   ┌────────────────┐   │
│   │ ▲▲▲▲▲▲▲▲▲▲▲▲▲▲ │   │
│   │ ░░░░░░░░░░░░░░ │   │  <- Motion guide
│   │                │   │
│   │  [Camera View] │   │
│   │                │   │
│   │ ░░░░░░░░░░░░░░ │   │
│   │ ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ │   │
│   └────────────────┘   │
│                        │
│   Progress: ████░░ 60% │
│                        │
│    [🔴 Recording...]   │
│                        │
│      [Cancel]          │
│                        │
└────────────────────────┘
```

### Technical Approach

```typescript
// Capture frames at intervals during scroll
async function captureScrollFrames(videoUri: string): Promise<string[]> {
  const frames: string[] = [];
  const duration = await getVideoDuration(videoUri);
  const frameInterval = 500; // ms
  
  for (let time = 0; time < duration; time += frameInterval) {
    const frame = await extractFrame(videoUri, time);
    frames.push(frame);
  }
  
  return frames;
}

// Stitch frames into panorama
async function stitchFrames(frames: string[]): Promise<string> {
  // Use image processing library to:
  // 1. Detect overlapping regions
  // 2. Align frames vertically
  // 3. Blend seams
  // 4. Output single long image
  
  return stitchedImageBase64;
}
```

**Pros:**
- Single, fluid action
- No manual "add more" steps

**Cons:**
- Requires steady hand
- Motion blur risk
- Complex stitching logic
- Higher processing requirements

**Recommendation:** Implement in Phase 2 after MVP

---

## Fallback: Manual Entry

When scanning fails or receipt is illegible, allow manual entry:

```
┌────────────────────────┐
│ [←]    Manual Entry    │
│                        │
│ Store: [             ] │
│ Date:  [Dec 1, 2025  ] │
│                        │
│ ─────────────────────  │
│ ITEMS                  │
│                        │
│ [Item name        ]    │
│ Qty:[1] Price:[$0.00]  │
│                   [🗑] │
│                        │
│ [Item name        ]    │
│ Qty:[1] Price:[$0.00]  │
│                   [🗑] │
│                        │
│    [+ Add Item]        │
│                        │
│ ─────────────────────  │
│ TOTAL:          $0.00  │
│                        │
│    [Save Invoice ✓]    │
└────────────────────────┘
```

---

## Edge Cases & Handling

| Scenario | Handling |
|----------|----------|
| Photos have no overlap | Warn user; may have gaps |
| Same item in multiple photos | Deduplicate by name+price |
| Header in photo 2 (not 1) | Check all photos for header |
| Total not visible | Calculate from items |
| Very blurry section | Skip items; warn user |
| 10+ photos | Allow but warn about processing time |
| Duplicate totals | Use total from last photo |

---

## UX Guidelines

### Do's ✅
- Guide user on how much overlap to include
- Show progress clearly
- Allow retaking individual photos
- Summarize what was extracted before final save

### Don'ts ❌
- Force user to count items beforehand
- Timeout too quickly during processing
- Delete photos on failure (allow retry)
- Make process feel tedious

---

## Implementation Priority

| Phase | Feature | Effort |
|-------|---------|--------|
| **MVP** | Multi-photo capture (2-5 photos) | Medium |
| **MVP** | Merge algorithm | Medium |
| **MVP** | Manual entry fallback | Low |
| **v1.1** | Overlap detection/guidance | Medium |
| **v1.2** | Scroll capture mode | High |
| **v2.0** | AI-powered stitching | High |

---

*See also: [User Flows - Scanning](./USER_FLOWS.md#flow-2-invoice-scanning-core-feature)*
