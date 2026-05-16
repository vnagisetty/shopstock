# ShopStock Icons — Usage Guide

## File list
| File | Use |
|---|---|
| logo.svg | Source file — scalable, use anywhere in the UI |
| favicon.ico | Browser tab icon — place in /public/ |
| apple-touch-icon.png | iOS home screen icon — place in /public/ |
| icon-192x192.png | PWA manifest — Android home screen |
| icon-512x512.png | PWA manifest — splash screen / Play Store |
| icon-144x144.png | PWA manifest — Windows tiles |
| icon-72, 96, 128, 152, 167, 180, 384 | Additional PWA / device sizes |

## Place all files in
```
/public/icons/
```
Except:
- `favicon.ico` → `/public/favicon.ico`
- `apple-touch-icon.png` → `/public/apple-touch-icon.png`

## vite-plugin-pwa manifest config
```js
icons: [
  { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
  { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
  { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
  { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
  { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
  { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
  { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
]
```

## index.html head tags
```html
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0D9488" />
```

## Brand color
Primary teal: #0D9488
Dark teal:    #0F766E
