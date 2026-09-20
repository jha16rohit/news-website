export const LIVE_TIMEZONE = "Asia/Kolkata";
export const LIVE_LOCALE = "en-IN";

const baseTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: LIVE_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

const baseDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: LIVE_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const baseDateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: LIVE_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

export function formatLiveTime(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LIVE_LOCALE, baseTimeOptions).format(date);
}

export function formatLiveDate(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LIVE_LOCALE, baseDateOptions).format(date);
}

export function formatLiveDateTime(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LIVE_LOCALE, baseDateTimeOptions).format(date);
}

export function formatLiveTimeShort(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LIVE_LOCALE, {
    timeZone: LIVE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function timeSince(timestamp: string | Date | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return formatLiveDate(date);
}