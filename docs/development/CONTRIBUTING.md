# Contributing Guidelines

## Overview

Thank you for contributing to Invoice Intelligence! This document outlines the process and standards for contributing to the project.

---

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see [SETUP.md](./SETUP.md))
4. Create a feature branch
5. Make your changes
6. Submit a pull request

---

## Branch Naming Convention

```
<type>/<short-description>

Examples:
feature/invoice-scanning
fix/camera-permission
refactor/auth-service
docs/api-documentation
chore/update-dependencies
```

### Branch Types

| Type | Purpose |
|------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `docs/` | Documentation updates |
| `chore/` | Maintenance tasks |
| `test/` | Test additions/updates |

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```bash
# Feature
feat(scanner): add flash toggle to camera screen

# Bug fix
fix(auth): resolve anonymous sign-in crash on Android

# Refactor
refactor(firestore): extract query helpers into utils

# Documentation
docs(api): add Gemini integration documentation

# Chore
chore(deps): update react-native to 0.73

# Breaking change
feat(payment)!: switch to Moko Afrika for DRC payments

BREAKING CHANGE: Payment API has changed. Update all payment integrations.
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |
| `revert` | Reverts a previous commit |

### Scopes

| Scope | Description |
|-------|-------------|
| `scanner` | Invoice scanning feature |
| `comparison` | Price comparison feature |
| `reports` | Dashboard/reporting |
| `auth` | Authentication |
| `payment` | Subscription/payments |
| `firestore` | Database operations |
| `gemini` | AI integration |
| `ui` | UI components |
| `nav` | Navigation |
| `config` | Configuration |

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces over types when possible
- Export types from dedicated `.types.ts` files

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

const getUser = async (id: string): Promise<User | null> => {
  // ...
};

// ❌ Bad
const getUser = async (id: any): Promise<any> => {
  // ...
};
```

### React/React Native

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components focused and small
- Use NativeWind for styling

```tsx
// ✅ Good - Small, focused component
interface PriceCardProps {
  itemName: string;
  price: number;
  storeName: string;
  onPress: () => void;
}

export function PriceCard({ itemName, price, storeName, onPress }: PriceCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-white rounded-lg p-4 mb-2">
      <Text className="font-semibold text-lg">{itemName}</Text>
      <Text className="text-primary-500">${price.toFixed(2)}</Text>
      <Text className="text-gray-500 text-sm">{storeName}</Text>
    </TouchableOpacity>
  );
}

// ❌ Bad - Too many responsibilities
export function PriceCard({ item }) {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  // ... lots of logic that should be in a hook
}
```

### File Organization

```
src/features/scanner/
├── screens/
│   └── CameraScreen.tsx       # Screen component
├── components/
│   ├── CameraOverlay.tsx      # UI component
│   └── CaptureButton.tsx      # UI component
├── hooks/
│   └── useCamera.ts           # Custom hook
├── services/
│   └── scannerService.ts      # Business logic
├── utils/
│   └── imageUtils.ts          # Utilities
├── types/
│   └── scanner.types.ts       # TypeScript types
└── __tests__/
    └── CameraScreen.test.tsx  # Tests
```

---

## Testing Requirements

### Unit Tests

- All services must have unit tests
- Test edge cases and error scenarios
- Aim for 80% code coverage

```typescript
// src/features/scanner/services/__tests__/scannerService.test.ts

describe('ScannerService', () => {
  describe('parseInvoice', () => {
    it('should return parsed invoice data on success', async () => {
      // Arrange
      const mockImage = 'base64_image_data';
      
      // Act
      const result = await scannerService.parseInvoice(mockImage);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('shopName');
      expect(result.data).toHaveProperty('items');
    });

    it('should return error on invalid image', async () => {
      // ...
    });

    it('should retry on transient failure', async () => {
      // ...
    });
  });
});
```

### Component Tests

- Test user interactions
- Test conditional rendering
- Mock external dependencies

```typescript
// src/features/scanner/components/__tests__/CaptureButton.test.tsx

describe('CaptureButton', () => {
  it('should call onCapture when pressed', () => {
    const onCapture = jest.fn();
    const { getByTestId } = render(<CaptureButton onCapture={onCapture} />);
    
    fireEvent.press(getByTestId('capture-button'));
    
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when capturing', () => {
    const { getByTestId } = render(<CaptureButton isCapturing={true} />);
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

---

## Pull Request Process

### Before Submitting

1. Ensure your branch is up to date with `main`
2. Run all tests: `npm test`
3. Run linting: `npm run lint`
4. Run type check: `npm run typecheck`
5. Test on both iOS and Android (if applicable)

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #(issue number)

## Testing
- [ ] Unit tests added/updated
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested offline scenario (if applicable)

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] All tests pass
```

### Review Process

1. At least one approval required
2. All CI checks must pass
3. No merge conflicts
4. Squash and merge for clean history

---

## Documentation

### When to Update Docs

- New feature added → Update relevant docs
- API changed → Update API_CONTRACTS.md
- Data model changed → Update DATA_MODELS.md
- User flow changed → Update USER_FLOWS.md
- Bug fix → Consider adding to known issues

### Documentation Style

- Use clear, concise language
- Include code examples
- Keep diagrams up to date
- Use tables for structured data

---

## Code Review Guidelines

### What to Look For

1. **Functionality**: Does the code work as intended?
2. **Design**: Is the code well-designed?
3. **Complexity**: Is the code simple enough?
4. **Tests**: Are there adequate tests?
5. **Naming**: Are names descriptive?
6. **Comments**: Are comments clear and useful?
7. **Style**: Does the code follow conventions?
8. **Documentation**: Is documentation updated?

### Giving Feedback

- Be constructive and specific
- Explain the "why" behind suggestions
- Distinguish between required changes and suggestions
- Use "nit:" prefix for minor suggestions

```markdown
# Good feedback
The async/await pattern here could cause a race condition if the user
taps rapidly. Consider adding a loading state check before proceeding.

# With suggestion
nit: Consider renaming `data` to `invoiceData` for clarity.
```

---

## Release Process

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0  - Initial release
1.1.0  - New feature (backward compatible)
1.1.1  - Bug fix
2.0.0  - Breaking change
```

### Release Checklist

1. [ ] All PRs merged to `main`
2. [ ] Version bumped in `package.json`
3. [ ] CHANGELOG.md updated
4. [ ] Create release branch `release/vX.X.X`
5. [ ] Final testing on release branch
6. [ ] Tag release `vX.X.X`
7. [ ] Build and deploy

---

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with reproduction steps
- **Features**: Open an Issue with use case description

---

*Happy contributing! 🎉*
