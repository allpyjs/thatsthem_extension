# ThatsThem Email Extractor (Chrome Extension)

Extracts **full email addresses** from [ThatsThem](https://thatsthem.com) name/search result pages.

On ThatsThem, the local part of each email is hidden with CSS (e.g. `g██████@hotmail.com`), but the full address is already in the page as a **base64 `x-href`** attribute (e.g. `/email/goman13@hotmail.com`). This extension decodes those values—no clicking through each link required.

## Install (developer mode)

1. Open Chrome → **Extensions** → **Manage extensions**
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `thatsthem_extension`

## Use

1. Go to a ThatsThem page with results, e.g.  
   https://thatsthem.com/name/George-Oldham
2. Click the extension icon
3. Click **Extract emails**
4. **Copy all** or **Download JSON** (includes grouping by person when the page has multiple `.record` cards)

## How it works

Each email row looks like:

```html
<span x-href="L2VtYWlsL2dvbWFuMTNAaG90bWFpbC5jb20=" ...>
  g<span class="redacted">...</span>@hotmail.com
</span>
```

`L2VtYWlsL2dvbWFuMTNAaG90bWFpbC5jb20=` decodes to `/email/goman13@hotmail.com`.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `content.js` | Decodes `x-href` on the page |
| `popup.html` / `popup.js` / `popup.css` | Toolbar popup UI |

## Note

Use only in compliance with ThatsThem’s terms of service and applicable privacy laws.
