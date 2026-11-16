import React, { useEffect } from "react"
import { loadTwitterWidgetScript, initializeTwitterWidgets } from "./twitterWidgetLoader"
import "./TwitterEmbed.css"

interface TwitterEmbedProps {
  /** The X/Twitter post URL to embed */
  url: string
}

/**
 * Standalone Twitter/X embed component.
 *
 * Renders a <blockquote class="twitter-tweet"> containing the tweet URL.
 * On mount, loads the widgets script (if needed) and initializes the
 * blockquote into an embed card via twttr.widgets.load().
 *
 * Graceful fallback: if the script fails to load, the blockquote renders
 * as a plain clickable link.
 */
export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ url }) => {
  useEffect(() => {
    loadTwitterWidgetScript()
      .then(() => {
        initializeTwitterWidgets()
      })
      .catch(() => {
        // Script failed to load — blockquote remains as a plain link
      })
  }, [url])

  return (
    <div className="twitter-embed-container">
      <blockquote className="twitter-tweet">
        <a href={url}>{url}</a>
      </blockquote>
    </div>
  )
}
