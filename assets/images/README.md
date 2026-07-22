# App icon assets

`icon.png` is the real artwork. The three `ios-*.png` variants are **derived from
it** by `npm run icons:ios`. Everything else is still a generated placeholder
(`npm run icons`) and shows a green leaf mark, not the globe.

| File | Size | Alpha | Source | Used for |
| --- | --- | --- | --- | --- |
| `icon.png` | 1254×1254 | no | **real artwork** | `expo.icon` — universal fallback, Android legacy, web |
| `ios-light.png` | 1024×1024 | no | derived | `ios.icon.light` — default iOS home screen |
| `ios-dark.png` | 1024×1024 | no | derived | `ios.icon.dark` — iOS 18 dark appearance |
| `ios-tinted.png` | 1024×1024 | no | derived | `ios.icon.tinted` — iOS 18 tinted appearance |
| `android-icon-foreground.png` | 512×512 | yes | placeholder | `android.adaptiveIcon.foregroundImage` |
| `android-icon-background.png` | 512×512 | no | placeholder | `android.adaptiveIcon.backgroundImage` |
| `android-icon-monochrome.png` | 432×432 | yes | placeholder | `android.adaptiveIcon.monochromeImage` |
| `splash-icon.png` | 1024×1024 | yes | placeholder | `expo-splash-screen`, rendered 200pt wide |
| `favicon.png` | 48×48 | no | placeholder | web |

## Regenerating the iOS variants

```bash
npm run icons:ios      # after any change to icon.png
```

The script re-reads `icon.png` and rewrites all three. It never writes
`icon.png` itself. What it does on the way through:

- **Squares off pre-rounded corners.** The current artwork ships its own rounded
  corners with black outside them. iOS masks icons with its own superellipse
  (~0.224 of the side, vs the artwork's ~0.178), so it happens to crop that
  black away — but Apple's guidance is to supply a full-bleed square, and
  filling the corners back in with the background plate makes the result
  independent of whatever mask any given surface applies.
- **Resamples to exactly 1024×1024** and writes with **no alpha channel**. App
  Store Connect rejects icons carrying one (`ITMS-90717`).
- **Recolors only the background plate** for the dark variant, using a flood
  fill from the border. The fill is *connectivity*-based rather than a global
  color match, because the pale highlight tracing the leaf is the same color as
  the plate; a global match would wreck it. Narrow plate-colored channels that
  open onto the border get sealed first (`SEAL_RADIUS`), or the fill leaks up
  the leaf edge and blacks out the highlight.
- **Separates the tinted variant by hue, not luminance.** The leaf green and
  ocean blue sit within ~16/255 of each other in luminance, so a straight
  grayscale flattens the globe into a featureless disc.

If you replace `icon.png` with artwork whose background is *not* a flat plate
(a photo, a full-bleed gradient), the dark variant's segmentation will not have
anything meaningful to separate — draw that one by hand instead.

## Still on placeholder art

`splash-icon.png` and the Android layers show the old green leaf mark, so the
launch screen does not match the icon. They can be derived from `icon.png` the
same way (the splash needs the plate knocked out to transparency, since it
renders on white in light mode and black in dark). Not done yet — iOS icon work
only.

## After changing any icon

Icons are native config, so a JS-only OTA update will not pick them up:

```bash
eas build --platform ios --profile production
```
