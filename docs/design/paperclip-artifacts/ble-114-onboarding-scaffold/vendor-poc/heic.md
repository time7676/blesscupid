# HEIC photo pipeline

**Decision:** Server-side normalize on upload. Client uploads HEIC bytes as-is.

## Why

- Client stays vendor-agnostic. No native-module footprint for an edge case (only iOS users with HEIC default).
- Single decode path for all platforms. Web/admin tools also benefit.
- Aligns with eng-spec recommendation: "Recommend server-side (simpler client, vendor-agnostic)."

## Server contract (this scaffold's stub)

```
POST /api/v1/onboarding/upload-url
  body: { kind: 'photo' | 'selfie', contentType: 'image/jpeg' | 'image/png' | 'image/heic' }
  returns: { uploadUrl: string, assetId: string }

# Client PUTs bytes to signed S3 URL. S3 trigger → Lambda runs `sharp` to convert HEIC → JPEG, strip EXIF, downscale to 2048px max, write canonical JPEG back next to original at `assets/{id}/canonical.jpg`. Set `assetId` ready when canonical exists.
```

Client treats `assetId` as opaque. `<PhotoUploadDropzone>` polls `GET /onboarding/asset/{assetId}` until `status: 'ready'` (debounced, max 4 attempts × 1s).

## Client implementation note

```ts
// PhotoUploadDropzone.tsx — content type detection
const ext = uri.split('.').pop()?.toLowerCase();
const contentType = ext === 'heic' ? 'image/heic' : ext === 'png' ? 'image/png' : 'image/jpeg';
```

`expo-image-picker` returns the original URI including HEIC on iOS when `quality: 1` and `mediaTypes: 'Images'`. We do **not** ask Expo to convert (`base64: false`, `allowsEditing: false`).

## Fallback (Android-only)

If backend pipeline isn't ready by v1.0 cut and Android users hit "HEIC selected from cloud-shared album":

```
pnpm add react-native-heic-converter
```

```ts
import HeicConverter from 'react-native-heic-converter';
const { path } = await HeicConverter.convert({ path: uri, quality: 0.85, extension: 'jpg' });
// upload `path` instead of `uri`
```

Wrap behind feature flag `ONBOARDING_HEIC_CLIENT_DECODE` (default `false`). Server-side normalize is always preferred.

## Anti-pattern check

Do NOT auto-rotate or auto-crop client-side. Modesty heuristics are a separate moderation pass (BLE-45). Onboarding photo upload is just bytes-in.
