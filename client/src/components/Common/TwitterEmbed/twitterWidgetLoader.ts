/**
 * Singleton Twitter/X widgets.js script loader.
 *
 * Loads https://platform.twitter.com/widgets.js exactly once and shares
 * readiness state across all callers. Handles already-loaded, currently
 * loading, newly injected, and failed states. Supports safe retry after
 * failure.
 */

// Module-level state shared across all callers
let scriptLoadingPromise: Promise<void> | null = null
let twitterWidgetsReady = false

/**
 * Load the Twitter widgets script exactly once.
 *
 * Resolves when window.twttr.widgets.load is available.
 * Rejects on load failure but allows retry on subsequent calls.
 *
 * Handles:
 *   - Already loaded: resolves immediately
 *   - Currently loading: returns the same in-flight promise
 *   - Newly injected: creates <script>, appends to body
 *   - Failed: rejects, clears in-flight promise so next call can retry
 */
export async function loadTwitterWidgetScript(): Promise<void> {
  // If already ready, resolve immediately
  if (twitterWidgetsReady && window.twttr?.widgets?.load) {
    return
  }

  // If a load is already in progress, return the same promise
  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  // Check for existing script element in DOM (avoid duplicate injection)
  const existingScript = Array.from(document.scripts).find(
    (s: HTMLScriptElement) => s.src && s.src.includes("platform.twitter.com/widgets.js")
  )

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const onLoad = () => {
      twitterWidgetsReady = true
      resolve()
    }
    const onError = (event: Event | string) => {
      twitterWidgetsReady = false
      // Allow retry: clear in-flight promise so next call can retry
      scriptLoadingPromise = null
      reject(new Error(`Failed to load Twitter widgets script: ${String(event)}`))
    }

    if (existingScript) {
      // Script already present in DOM
      if (window.twttr) {
        // Already loaded and ready
        onLoad()
      } else {
        // Still loading — wait for its load event
        existingScript.addEventListener("load", onLoad, { once: true })
        existingScript.addEventListener("error", onError as EventListener, { once: true })
      }
    } else {
      // Inject new script
      const script = document.createElement("script")
      script.src = "https://platform.twitter.com/widgets.js"
      script.async = true
      script.onload = onLoad
      script.onerror = onError
      document.body.appendChild(script)
    }
  })

  return scriptLoadingPromise
}

/**
 * Initialize Twitter widgets after article DOM is available.
 *
 * Calls window.twttr.widgets.load() scoped to the given container
 * (defaults to document.body). Safe to call multiple times — only
 * converts blockquotes that haven't been rendered yet.
 *
 * @param scope - Container element to scope widget initialization to.
 *                Defaults to document.body.
 */
export function initializeTwitterWidgets(scope?: HTMLElement): void {
  if (!twitterWidgetsReady || !window.twttr?.widgets?.load) {
    return
  }

  const target = scope ?? document.body
  window.twttr.widgets.load(target)
}

/**
 * Check whether the Twitter widgets API is ready.
 */
export function isTwitterWidgetsReady(): boolean {
  return twitterWidgetsReady && !!window.twttr?.widgets?.load
}
