# Plan: Replace Copy Link Alert with Auto-Dismiss Toast

## Summary
Replace the blocking `alert("Link copied!")` in the Article Details page's Copy Link handler with a non-blocking `react-hot-toast` notification that auto-dismisses, matching the existing `handleCopyLink` pattern already used for comment links.

## Exact file path and code location
- File: `client/src/components/User/ArticalDetails/ArticalDetails.tsx`
- Function: `handleShare`, branch `if (platform === "copy")` at lines 771-775
- Current code:
  ```ts
  if (platform === "copy") {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied!");
    return;
  }
  ```

## Confirmed preconditions
- `react-hot-toast` is imported at line 36: `import toast from "react-hot-toast";`
- `<Toaster position="top-right" reverseOrder={false} />` is globally mounted in `client/src/App.tsx` at line 77-80 — no provider setup needed.
- Default toast duration is ~4000ms; user wants 2-3 seconds, so pass `duration: 2500` per toast.
- Identical successful pattern already exists in same file's `handleCopyLink` (lines 971-983).

## Step-by-step implementation tasks
1. Replace lines 771-775 in `ArticalDetails.tsx`:
   ```ts
   if (platform === "copy") {
     try {
       await navigator.clipboard.writeText(shareUrl);
       toast.success("Link copied!", { duration: 2500 });
     } catch {
       toast.error("Failed to copy link.", { duration: 2500 });
     }
     return;
   }
   ```
2. Run TypeScript build/typecheck to confirm compilation.

## File change scope
| File | Required? | Change |
|------|-----------|--------|
| `client/src/components/User/ArticalDetails/ArticalDetails.tsx` | Yes | Replace `alert()` block with awaited try/catch + toast |

No new dependencies, no provider setup, no other files.

## Risk assessment
- Low risk. The change is isolated to one branch of one handler.
- `await navigator.clipboard.writeText()` may throw if clipboard permission is denied — handled by catch branch showing error toast.
- `react-hot-toast` Toaster is globally mounted, so toasts will render.
- No impact on other share buttons (fb, tw, whatsapp, native), article URL generation (`getShareUrl(slug)`), CSS, layout, or mobile responsiveness.

## Verification checklist
- [ ] Click Copy Link icon → "Link copied!" toast appears top-right, auto-dismisses after ~2.5s, no OK click required.
- [ ] Page remains interactive during toast display.
- [ ] Clipboard contains the article URL after clicking.
- [ ] Clipboard failure (permission denied/blocked) → "Failed to copy link." toast appears non-blocking.
- [ ] Other share buttons unaffected.
- [ ] Article URL generation unchanged.
- [ ] Layout and mobile responsiveness unchanged.
- [ ] `tsc --noEmit` passes with zero errors.

## Expected final behavior
Clicking the Copy Link icon copies the article URL to the clipboard and shows a non-blocking "Link copied!" toast that auto-dismisses after ~2-3 seconds. Copy failures show "Failed to copy link." toast. No `alert()` dialog appears.

---

Plan created. No files have been modified. Awaiting explicit user approval before implementation.