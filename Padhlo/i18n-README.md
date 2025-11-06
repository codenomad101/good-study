# i18next Internationalization Setup

This app uses i18next for internationalization support, allowing users to switch between English and Marathi languages.

## Setup

The i18next configuration is located in:
- **Configuration**: `i18n.ts`
- **Translation Files**: `locales/en/translation.json` and `locales/mr/translation.json`
- **Language Context**: `contexts/LanguageContext.tsx`
- **Translation Hook**: `hooks/useTranslation.ts`

## Usage

### Basic Translation

```tsx
import { useTranslation } from '../hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('home.welcomeBack')}</Text>
  );
};
```

### Translation with Interpolation

```tsx
const { t } = useTranslation();

<Text>{t('home.welcomeBack', { name: user?.fullName })}</Text>
```

### Changing Language

```tsx
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { language, changeLang } = useLanguage();
  
  return (
    <TouchableOpacity onPress={() => changeLang('mr')}>
      <Text>Switch to Marathi</Text>
    </TouchableOpacity>
  );
};
```

## Translation Key Structure

Translation keys are organized by feature/section:

- `common.*` - Common UI elements (buttons, labels, etc.)
- `auth.*` - Authentication related strings
- `home.*` - Home screen content
- `practice.*` - Practice screen content
- `exam.*` - Exam screen content
- `community.*` - Community screen content
- `notes.*` - Notes screen content
- `schedule.*` - Schedule screen content
- `leaderboard.*` - Leaderboard screen content
- `profile.*` - Profile screen content

## Adding New Translations

1. **Add to English translation file** (`locales/en/translation.json`)
2. **Add to Marathi translation file** (`locales/mr/translation.json`)
3. **Use in components** with `t('key.path')`

Example:
```json
// locales/en/translation.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is a feature"
  }
}

// locales/mr/translation.json
{
  "myFeature": {
    "title": "माझी वैशिष्ट्य",
    "description": "हे एक वैशिष्ट्य आहे"
  }
}
```

Usage:
```tsx
<Text>{t('myFeature.title')}</Text>
```

## Language Detection

The app automatically detects the device language on first launch:
- If device language is Marathi (`mr`), it sets Marathi
- Otherwise, it defaults to English (`en`)

The selected language is saved in AsyncStorage and persists across app restarts.

## Language Switcher

A language switcher is available in the user profile dropdown under "More Settings". Users can toggle between English and Marathi.

## Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Use descriptive key names** that indicate where they're used
3. **Group related translations** by feature/screen
4. **Keep translations consistent** across both languages
5. **Test both languages** to ensure UI layout works correctly

## Common Patterns

### Pluralization
```tsx
// For plural forms, use separate keys
t('common.items', { count: 5 }) // You may need to implement plural rules
```

### Dynamic Content
```tsx
// For dynamic content, use interpolation
t('home.welcomeBack', { name: user?.fullName })
```

### Conditional Translation
```tsx
// Use conditional logic when needed
{isLoading ? t('common.loading') : t('common.done')}
```

