# Accessories Feature Test Plan

## 1. Avatar Assets Mapping

- Select each available avatar and confirm the image resolves from bundled assets when available.
- Toggle between teacher and student profiles to ensure legacy `image_url` records still display correctly.

## 2. Accessories Shop & Loadout

- Open `/avatars` and verify the preview card reflects currently equipped accessories.
- Attempt to purchase an accessory with insufficient points and confirm the action is disabled.
- Purchase an accessory with enough points; ensure it appears under “My Accessories” and the balance updates.
- Equip and unequip items while confirming the status badge and preview update instantly.

## 3. Header Rendering

- Refresh the dashboard; header avatar should display equipped accessories without reloading the whole page.
- Unequip an item and confirm the overlay disappears after the mutation succeeds.

## 4. Offline & Caching

- Load the accessories page, then go offline (DevTools > Network > Offline).
- Reload and confirm previously fetched Supabase accessory images are served from the cache.
- Verify the rest of the PWA continues to use the offline page fallback for navigation requests.

## 5. Error Handling

- Force a network failure (DevTools > Request blocking) during purchase to ensure the UI surfaces `toast` errors.
- Simulate Supabase errors by providing an invalid session token and confirm mutations report failures cleanly.
