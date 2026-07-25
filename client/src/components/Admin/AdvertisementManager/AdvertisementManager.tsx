import { useState, useEffect, useCallback } from "react";
import {
  Calendar, MessageSquare, XCircle,
  Link as LinkIcon, MonitorPlay, X, Send, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Ban, History,
} from "lucide-react";
import { apiClient } from "../../../api/client";
import "./AdvertisementManager.css";

/* ─── Types ─────────────────────────────────────────────── */
type AdType = "card" | "strip";
type InquiryStatus = "pending" | "published" | "rejected";
type PublishedStatus = "active" | "expired" | "ended";

interface AdInquiry {
  _id: string;
  submittedAt: string;
  status: InquiryStatus;
  name: string;
  email: string;
  phone: string;
  company?: string;
  targetPage: string;
  adType: AdType;
  imageUrl: string;
  linkUrl?: string;
  message?: string;
  rejectionReason?: string;
}

interface PublishedAd {
  id: string;
  inquiryId: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  targetPage: string;
  adType: AdType;
  advertiser: string;
  status: PublishedStatus;
  durationDays?: number;
  publishNotes?: string;
  submittedAt?: string;
  publishedAt: string;
  expiresAt?: string;
  renewedAt?: string;
  endedAt?: string;
  endReason?: string;
}

const PAGE_LABEL: Record<string, string> = {
  home: "Home Page", all: "Sitewide (All Pages)", politics: "Politics",
  sports: "Sports", business: "Business & Finance", technology: "Technology",
  entertainment: "Entertainment", health: "Health & Wellness",
};

const PAGE_SIZE = 10;

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function daysLeftLabel(expiresAt?: string) {
  const d = daysLeft(expiresAt);
  if (d === null) return "No expiry";
  if (d <= 0) return "Expires today";
  if (d === 1) return "1 Day Left";
  return `${d} Days Left`;
}

function daysLeftTone(expiresAt?: string): "ok" | "warn" | "danger" {
  const d = daysLeft(expiresAt);
  if (d === null) return "ok";
  if (d <= 0) return "danger";
  if (d <= 7) return "warn";
  return "ok";
}

/* ─── Pagination Controls ────────────────────────────────── */
function PaginationControls({
  page, totalItems, onPageChange,
}: { page: number; totalItems: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="adm-pagination">
      <span className="adm-pagination-info">
        Showing {startItem}–{endItem} of {totalItems}
      </span>
      <div className="adm-pagination-btns">
        <button
          className="adm-pg-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="adm-pagination-page">Page {page} of {totalPages}</span>
        <button
          className="adm-pg-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Timeline ────────────────────────────────────────────── */
function Timeline({ entries }: { entries: { label: string; date?: string }[] }) {
  const valid = entries.filter(e => !!e.date);
  if (valid.length === 0) return null;
  return (
    <div className="adm-timeline">
      <div className="adm-timeline-title"><History size={13} /> Timeline</div>
      <div className="adm-timeline-list">
        {valid.map((e, i) => (
          <div className="adm-timeline-item" key={i}>
            <span className="adm-timeline-dot" />
            <div>
              <div className="adm-timeline-label">{e.label}</div>
              <div className="adm-timeline-date">{fmtDate(e.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Inquiry Detail Modal ───────────────────────────────── */
function InquiryDetailModal({
  inquiry, onClose, onPublish, rejectingId, setRejectingId, rejectNote, setRejectNote, onConfirmReject, busyId,
}: {
  inquiry: AdInquiry; onClose: () => void; onPublish: (iq: AdInquiry) => void;
  rejectingId: string | null; setRejectingId: (id: string | null) => void;
  rejectNote: string; setRejectNote: (v: string) => void;
  onConfirmReject: (id: string) => void; busyId: string | null;
}) {
  const isRejecting = rejectingId === inquiry._id;
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>{inquiry.company || inquiry.name}</h2>
            <p>{inquiry.name} · {PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage} · {inquiry.adType === "card" ? "Card" : "Strip / Banner"}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-expand-grid">
            <div className="adm-expand-img"><img src={inquiry.imageUrl} alt="Ad creative" /></div>
            <div className="adm-expand-info">
              <div className="adm-iq-detail-row"><span>{inquiry.email}</span></div>
              <div className="adm-iq-detail-row"><span>{inquiry.phone}</span></div>
              <div className="adm-iq-detail-row"><span>Submitted {fmtDate(inquiry.submittedAt)}</span></div>
              {inquiry.linkUrl && (
                <div className="adm-iq-detail-row">
                  <LinkIcon size={13} />
                  <a href={inquiry.linkUrl} target="_blank" rel="noreferrer">{inquiry.linkUrl}</a>
                </div>
              )}
            </div>
          </div>
          {inquiry.message && <div className="adm-iq-message" style={{ marginBottom: 16 }}><p>"{inquiry.message}"</p></div>}

          {isRejecting ? (
            <div className="adm-reject-box">
              <label>Reason for rejection</label>
              <textarea
                rows={2}
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Let the advertiser know why this was rejected…"
              />
              <div className="adm-reject-actions">
                <button className="adm-btn-cancel" onClick={() => { setRejectingId(null); setRejectNote(""); }}>Cancel</button>
                <button
                  className="adm-btn-reject-confirm"
                  disabled={!rejectNote.trim() || busyId === inquiry._id}
                  onClick={() => onConfirmReject(inquiry._id)}
                >
                  {busyId === inquiry._id ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />} Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="adm-expand-actions">
              <button className="adm-btn-publish-now" onClick={() => onPublish(inquiry)}>
                <Send size={14} /> Publish
              </button>
              <button className="adm-btn-reject" onClick={() => { setRejectingId(inquiry._id); setRejectNote(""); }}>
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Publish Modal (Duration + Notes only) ──────────────── */
function PublishModal({
  inquiry, onClose, onPublish,
}: { inquiry: AdInquiry; onClose: () => void; onPublish: (ad: PublishedAd) => void }) {
  const [durationDays, setDurationDays] = useState("30");
  const [publishNotes, setPublishNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    const parsedDuration = parseInt(durationDays, 10);
    if (!durationDays || isNaN(parsedDuration) || parsedDuration <= 0) {
      setError("Duration is required");
      return;
    }
    setLoading(true); setError(null);
    try {
      console.log("Inquiry:", inquiry);
console.log("Inquiry ID:", inquiry._id);
      const ad: PublishedAd = await apiClient("/api/advertisement/published-ads", {
        method: "POST",
        body: JSON.stringify({
          inquiryId: inquiry._id,
          durationDays: parsedDuration,
          publishNotes: publishNotes.trim() || undefined,
        }),
      });
      onPublish(ad);
    } catch (err: any) {
      setError(err.message || "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>Publish Advertisement</h2>
            <p>{inquiry.company || inquiry.name} · {PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage} · {inquiry.adType === "card" ? "Card" : "Strip / Banner"}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          {error && <div className="adm-err" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="adm-img-preview" style={{ marginBottom: 16 }}>
            <img src={inquiry.imageUrl} alt="Ad creative" />
          </div>
          <div className="adm-pf-group">
            <label>Duration in Days (Required)</label>
            <input type="number" min={1} value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="e.g. 30" />
          </div>
          <div className="adm-pf-group">
            <label>Publish Notes (Optional)</label>
            <textarea
              rows={3}
              value={publishNotes}
              onChange={e => setPublishNotes(e.target.value)}
              placeholder="Any internal notes about this placement…"
            />
          </div>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-publish" onClick={handlePublish} disabled={loading}>
            {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} />} {loading ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Renew Modal (Duration + Notes) ─────────────────────── */
function RenewModal({
  ad, onClose, onConfirm, busy,
}: { ad: PublishedAd; onClose: () => void; onConfirm: (id: string, durationDays: number, notes: string) => void; busy: boolean }) {
  const [durationDays, setDurationDays] = useState(String(ad.durationDays || 30));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const parsedDuration = parseInt(durationDays, 10);
    if (!durationDays || isNaN(parsedDuration) || parsedDuration <= 0) {
      setError("Duration is required");
      return;
    }
    setError(null);
    onConfirm(ad.id, parsedDuration, notes.trim());
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>Renew Advertisement</h2>
            <p>{ad.advertiser} · {PAGE_LABEL[ad.targetPage] || ad.targetPage}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          {error && <div className="adm-err" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="adm-pf-group">
            <label>Duration in Days (Required)</label>
            <input type="number" min={1} value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="e.g. 30" />
          </div>
          <div className="adm-pf-group">
            <label>Notes (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any internal notes about this renewal…"
            />
          </div>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-publish" onClick={handleConfirm} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} {busy ? "Renewing…" : "Renew"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── End Advertisement Modal ────────────────────────────── */
function EndAdvertisementModal({
  ad, onClose, onConfirm, busy,
}: { ad: PublishedAd; onClose: () => void; onConfirm: (id: string, note: string) => void; busy: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>End Advertisement</h2>
            <p>{ad.advertiser} · {PAGE_LABEL[ad.targetPage] || ad.targetPage}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-reject-box">
            <label>Notes (Optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Reason…"
            />
          </div>
        </div>
        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-reject-confirm" onClick={() => onConfirm(ad.id, note.trim())} disabled={busy}>
            {busy ? <Loader2 size={13} className="spin" /> : <Ban size={13} />} {busy ? "Ending…" : "End"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Live Ad Detail Modal ───────────────────────────────── */
function LiveAdDetailModal({
  ad, onClose, onRenew, onEnd, busyId,
}: { ad: PublishedAd; onClose: () => void; onRenew: (ad: PublishedAd) => void; onEnd: (ad: PublishedAd) => void; busyId: string | null }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>{ad.advertiser}</h2>
            <p>{PAGE_LABEL[ad.targetPage] || ad.targetPage} · {ad.adType === "card" ? "Card" : "Strip / Banner"}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-expand-grid">
            <div className="adm-expand-img"><img src={ad.imageUrl} alt={ad.altText} /></div>
            <div className="adm-expand-info">
              <div className="adm-iq-detail-row"><LinkIcon size={13} /><a href={ad.linkUrl} target="_blank" rel="noreferrer">{ad.linkUrl}</a></div>
              <div className="adm-iq-detail-row"><Calendar size={13} /><span>Published {fmtDate(ad.publishedAt)}</span></div>
              <div className="adm-iq-detail-row"><span>{ad.durationDays ? `Duration: ${ad.durationDays} Days` : "No duration set"}</span></div>
              <div className="adm-iq-detail-row"><span>{daysLeftLabel(ad.expiresAt)}</span></div>
              <div className="adm-iq-detail-row"><span className="adm-pub-badge adm-pub-badge--live">● Live</span></div>
            </div>
          </div>
          {ad.publishNotes && <div className="adm-iq-message" style={{ marginBottom: 16 }}><p>"{ad.publishNotes}"</p></div>}

          <Timeline entries={[
            { label: "Submitted", date: ad.submittedAt },
            { label: "Published", date: ad.publishedAt },
            { label: "Renewed", date: ad.renewedAt },
            { label: "Expires", date: ad.expiresAt },
          ]} />

          <div className="adm-expand-actions">
            <button className="adm-btn-renew" disabled={busyId === ad.id} onClick={() => onRenew(ad)}>
              {busyId === ad.id ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} Renew
            </button>
            <button className="adm-btn-end" disabled={busyId === ad.id} onClick={() => onEnd(ad)}>
              <Ban size={13} /> End Advertisement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Expired / Ended Ad Detail Modal ────────────────────── */
function ExpiredAdDetailModal({
  ad, onClose, onRenew, busyId,
}: { ad: PublishedAd; onClose: () => void; onRenew: (ad: PublishedAd) => void; busyId: string | null }) {
  const endReason = ad.endReason || (ad.status === "expired" ? "Time Expired" : "Ended by Admin");
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>{ad.advertiser}</h2>
            <p>{PAGE_LABEL[ad.targetPage] || ad.targetPage} · {ad.adType === "card" ? "Card" : "Strip / Banner"}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-expand-grid">
            <div className="adm-expand-img"><img src={ad.imageUrl} alt={ad.altText} /></div>
            <div className="adm-expand-info">
              <div className="adm-iq-detail-row"><LinkIcon size={13} /><a href={ad.linkUrl} target="_blank" rel="noreferrer">{ad.linkUrl}</a></div>
              <div className="adm-iq-detail-row"><span>{ad.durationDays ? `Duration: ${ad.durationDays} Days` : "No duration set"}</span></div>
              <div className="adm-iq-detail-row">
                {ad.status === "expired"
                  ? <span className="adm-pub-badge adm-pub-badge--expired">Expired</span>
                  : <span className="adm-pub-badge adm-pub-badge--ended">Ended</span>}
              </div>
            </div>
          </div>
          <div className="adm-reject-box" style={{ marginBottom: 16 }}>
            <label>End Reason</label>
            <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{endReason}</p>
          </div>

          <Timeline entries={[
            { label: "Submitted", date: ad.submittedAt },
            { label: "Published", date: ad.publishedAt },
            { label: "Renewed", date: ad.renewedAt },
            { label: ad.status === "expired" ? "Expired" : "Ended", date: ad.endedAt || ad.expiresAt },
          ]} />

          <div className="adm-expand-actions">
            <button className="adm-btn-renew" disabled={busyId === ad.id} onClick={() => onRenew(ad)}>
              {busyId === ad.id ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} Renew
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Rejected Inquiry Detail Modal ──────────────────────── */
function RejectedDetailModal({ inquiry, onClose }: { inquiry: AdInquiry; onClose: () => void }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>{inquiry.company || inquiry.name}</h2>
            <p>{inquiry.name} · {PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage} · {inquiry.adType === "card" ? "Card" : "Strip / Banner"}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-expand-grid">
            <div className="adm-expand-img"><img src={inquiry.imageUrl} alt="Ad creative" /></div>
            <div className="adm-expand-info">
              <div className="adm-iq-detail-row"><span>{inquiry.email}</span></div>
              <div className="adm-iq-detail-row"><span>{inquiry.phone}</span></div>
              <div className="adm-iq-detail-row"><span>Submitted {fmtDate(inquiry.submittedAt)}</span></div>
            </div>
          </div>
          {inquiry.message && <div className="adm-iq-message" style={{ marginBottom: 16 }}><p>"{inquiry.message}"</p></div>}
          {inquiry.rejectionReason && (
            <div className="adm-reject-box">
              <label>Reason for rejection</label>
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{inquiry.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AdvertisementManager() {
  const [inquiries, setInquiries] = useState<AdInquiry[]>([]);
  const [publishedAds, setPublishedAds] = useState<PublishedAd[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "published" | "expired" | "rejected">("pending");

  const [viewingInquiry, setViewingInquiry] = useState<AdInquiry | null>(null);
  const [viewingLiveAd, setViewingLiveAd] = useState<PublishedAd | null>(null);
  const [viewingExpiredAd, setViewingExpiredAd] = useState<PublishedAd | null>(null);
  const [viewingRejected, setViewingRejected] = useState<AdInquiry | null>(null);

  const [publishingInquiry, setPublishingInquiry] = useState<AdInquiry | null>(null);
  const [endingAd, setEndingAd] = useState<PublishedAd | null>(null);
  const [renewingAd, setRenewingAd] = useState<PublishedAd | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [inqs, ads] = await Promise.all([
        apiClient("/api/advertisement/inquiries"),
        apiClient("/api/advertisement/published-ads"),
      ]);
      setInquiries(inqs);
      setPublishedAds(ads);
    } catch (err: any) {
      console.error("Failed to load data:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const pending = inquiries.filter(i => i.status === "pending");
  const rejected = inquiries.filter(i => i.status === "rejected");
  const liveAds = publishedAds.filter(a => a.status === "active");
  const expiredOnlyAds = publishedAds.filter(a => a.status === "expired");
  const endedOnlyAds = publishedAds.filter(a => a.status === "ended");
  const expiredOrEndedAds = [...expiredOnlyAds, ...endedOnlyAds];

  const pendingPageItems = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const livePageItems = liveAds.slice((livePage - 1) * PAGE_SIZE, livePage * PAGE_SIZE);
  const expiredPageItems = expiredOrEndedAds.slice((expiredPage - 1) * PAGE_SIZE, expiredPage * PAGE_SIZE);
  const rejectedPageItems = rejected.slice((rejectedPage - 1) * PAGE_SIZE, rejectedPage * PAGE_SIZE);

  const handleTabChange = (tab: "pending" | "published" | "expired" | "rejected") => {
    setActiveTab(tab);
  };

  const handlePublish = (ad: PublishedAd) => {
    setPublishedAds(prev => [ad, ...prev]);
    setInquiries(prev => prev.map(i => i._id === ad.inquiryId ? { ...i, status: "published" as InquiryStatus } : i));
    setPublishingInquiry(null);
    setViewingInquiry(null);
    setLivePage(1);
    setActiveTab("published");
  };

  const confirmReject = async (id: string) => {
    if (!rejectNote.trim()) return;
    setBusyId(id);
    try {
      await apiClient(`/api/advertisement/inquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", rejectionReason: rejectNote }),
      });
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: "rejected", rejectionReason: rejectNote } : i));
      setRejectingId(null);
      setRejectNote("");
      setViewingInquiry(null);
    } catch (err: any) {
      alert("Failed to reject: " + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleEndAd = async (adId: string, endReason: string) => {
    setBusyId(adId);
    try {
      const updated: PublishedAd = await apiClient(`/api/advertisement/published-ads/${adId}/end`, {
        method: "PATCH",
        body: JSON.stringify({ endReason: endReason || "Ended by Admin" }),
      });
      setPublishedAds(prev => prev.map(a => a.id === adId ? updated : a));
      setEndingAd(null);
      setViewingLiveAd(null);
      setExpiredPage(1);
    } catch (err: any) {
      alert("Failed to end advertisement: " + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRenewAd = async (adId: string, durationDays: number, notes: string) => {
    setBusyId(adId);
    try {
      const updated: PublishedAd = await apiClient(`/api/advertisement/published-ads/${adId}/renew`, {
        method: "PATCH",
        body: JSON.stringify({ durationDays, publishNotes: notes || undefined }),
      });
      setPublishedAds(prev => prev.map(a => a.id === adId ? updated : a));
      setRenewingAd(null);
      setViewingLiveAd(null);
      setViewingExpiredAd(null);
      setLivePage(1);
      setActiveTab("published");
    } catch (err: any) {
      alert("Failed to renew: " + err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adm-root">
      {/* HEADER */}
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Advertisement Manager</h1>
          <p className="adm-page-sub">Review requests, publish ads, and manage what's live on the site</p>
        </div>
        <div className="adm-header-stats">
          <div className="adm-hstat adm-hstat--warn"><span>{pending.length}</span><em>Pending</em></div>
          <div className="adm-hstat adm-hstat--green"><span>{liveAds.length}</span><em>Live</em></div>
          <div className="adm-hstat"><span>{expiredOnlyAds.length}</span><em>Expired</em></div>
          <div className="adm-hstat"><span>{rejected.length}</span><em>Rejected</em></div>
        </div>
      </div>

      {/* TABS */}
      <div className="adm-tabs">
        <button className={`adm-tab ${activeTab === "pending" ? "adm-tab--active" : ""}`} onClick={() => handleTabChange("pending")}>
          <MessageSquare size={15} /> Pending
          {pending.length > 0 && <span className="adm-tab-badge">{pending.length}</span>}
        </button>
        <button className={`adm-tab ${activeTab === "published" ? "adm-tab--active" : ""}`} onClick={() => handleTabChange("published")}>
          <MonitorPlay size={15} /> Published
          {liveAds.length > 0 && <span className="adm-tab-badge adm-tab-badge--green">{liveAds.length}</span>}
        </button>
        <button className={`adm-tab ${activeTab === "expired" ? "adm-tab--active" : ""}`} onClick={() => handleTabChange("expired")}>
          <History size={15} /> Expired
          {expiredOrEndedAds.length > 0 && <span className="adm-tab-badge adm-tab-badge--gray">{expiredOrEndedAds.length}</span>}
        </button>
        <button className={`adm-tab ${activeTab === "rejected" ? "adm-tab--active" : ""}`} onClick={() => handleTabChange("rejected")}>
          <XCircle size={15} /> Rejected
          {rejected.length > 0 && <span className="adm-tab-badge adm-tab-badge--gray">{rejected.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="adm-empty"><Loader2 size={32} className="spin" /></div>
      ) : (
        <>
          {/* ── PENDING ── */}
          {activeTab === "pending" && (
            <div className="adm-content">
              {pending.length === 0 ? (
                <div className="adm-empty"><MessageSquare size={40} /><h3>No pending requests</h3><p>New ad requests will appear here.</p></div>
              ) : (
                <div className="adm-table-card">
                  <table className="adm-data-table">
                    <thead>
                      <tr><th>Advertiser</th><th>Contact</th><th>Format</th><th>Target Page</th><th>Submitted</th></tr>
                    </thead>
                    <tbody>
                      {pendingPageItems.map(iq => (
                        <tr key={iq._id} className="adm-data-row" onClick={() => setViewingInquiry(iq)}>
                          <td><div className="adm-row-name">{iq.company || iq.name}</div><div className="adm-row-sub">{iq.name}</div></td>
                          <td><div className="adm-row-sub">{iq.email}</div><div className="adm-row-sub">{iq.phone}</div></td>
                          <td className="adm-td-cap">{iq.adType === "card" ? "Card" : "Strip"}</td>
                          <td>{PAGE_LABEL[iq.targetPage] || iq.targetPage}</td>
                          <td className="adm-row-sub">{fmtDate(iq.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationControls
                    page={pendingPage}
                    totalItems={pending.length}
                    onPageChange={(p) => setPendingPage(p)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── PUBLISHED (LIVE) ── */}
          {activeTab === "published" && (
            <div className="adm-content">
              {liveAds.length === 0 ? (
                <div className="adm-empty"><MonitorPlay size={40} /><h3>No live ads right now</h3><p>Publish an inquiry to see it here.</p></div>
              ) : (
                <div className="adm-table-card">
                  <table className="adm-data-table">
                    <thead>
                      <tr><th>Advertiser</th><th>Format</th><th>Published On</th><th>Expires On</th><th>Days Left</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {livePageItems.map(ad => {
                        const tone = daysLeftTone(ad.expiresAt);
                        return (
                          <tr key={ad.id} className="adm-data-row" onClick={() => setViewingLiveAd(ad)}>
                            <td><div className="adm-row-name">{ad.advertiser}</div></td>
                            <td className="adm-td-cap">{ad.adType === "card" ? "Card" : "Strip"}</td>
                            <td className="adm-row-sub">{fmtDate(ad.publishedAt)}</td>
                            <td className="adm-row-sub">{ad.expiresAt ? fmtDate(ad.expiresAt) : "No expiry"}</td>
                            <td><span className={`adm-days-badge adm-days-badge--${tone}`}>{daysLeftLabel(ad.expiresAt)}</span></td>
                            <td><span className="adm-pub-badge adm-pub-badge--live">● Live</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationControls
                    page={livePage}
                    totalItems={liveAds.length}
                    onPageChange={(p) => setLivePage(p)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── EXPIRED / ENDED ── */}
          {activeTab === "expired" && (
            <div className="adm-content">
              {expiredOrEndedAds.length === 0 ? (
                <div className="adm-empty"><History size={40} /><h3>Nothing here yet</h3><p>Ads that expire or are ended will show up here.</p></div>
              ) : (
                <div className="adm-table-card">
                  <table className="adm-data-table">
                    <thead>
                      <tr><th>Advertiser</th><th>Expired On</th><th>Duration</th><th>End Reason</th><th>Renew</th></tr>
                    </thead>
                    <tbody>
                      {expiredPageItems.map(ad => {
                        const endReason = ad.endReason || (ad.status === "expired" ? "Time Expired" : "Ended by Admin");
                        return (
                          <tr key={ad.id} className="adm-data-row" onClick={() => setViewingExpiredAd(ad)}>
                            <td><div className="adm-row-name">{ad.advertiser}</div></td>
                            <td className="adm-row-sub">{fmtDate(ad.endedAt || ad.expiresAt)}</td>
                            <td className="adm-td-cap">{ad.durationDays ? `${ad.durationDays} Days` : "—"}</td>
                            <td className="adm-reason-cell">{endReason}</td>
                            <td>
                              <button
                                className="adm-btn-renew-inline"
                                onClick={(e) => { e.stopPropagation(); setRenewingAd(ad); }}
                              >
                                <RefreshCw size={12} /> Renew
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationControls
                    page={expiredPage}
                    totalItems={expiredOrEndedAds.length}
                    onPageChange={(p) => setExpiredPage(p)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── REJECTED ── */}
          {activeTab === "rejected" && (
            <div className="adm-content">
              {rejected.length === 0 ? (
                <div className="adm-empty"><XCircle size={40} /><h3>No rejected requests</h3></div>
              ) : (
                <div className="adm-table-card">
                  <table className="adm-data-table">
                    <thead>
                      <tr><th>Advertiser</th><th>Contact</th><th>Format</th><th>Submitted</th><th>Reason</th></tr>
                    </thead>
                    <tbody>
                      {rejectedPageItems.map(iq => (
                        <tr key={iq._id} className="adm-data-row" onClick={() => setViewingRejected(iq)}>
                          <td><div className="adm-row-name">{iq.company || iq.name}</div></td>
                          <td><div className="adm-row-sub">{iq.email}</div></td>
                          <td className="adm-td-cap">{iq.adType === "card" ? "Card" : "Strip"}</td>
                          <td className="adm-row-sub">{fmtDate(iq.submittedAt)}</td>
                          <td className="adm-reason-cell">{iq.rejectionReason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationControls
                    page={rejectedPage}
                    totalItems={rejected.length}
                    onPageChange={(p) => setRejectedPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {viewingInquiry && (
        <InquiryDetailModal
          inquiry={viewingInquiry}
          onClose={() => { setViewingInquiry(null); setRejectingId(null); setRejectNote(""); }}
          onPublish={(iq) => { setPublishingInquiry(iq); setViewingInquiry(null); }}
          rejectingId={rejectingId}
          setRejectingId={setRejectingId}
          rejectNote={rejectNote}
          setRejectNote={setRejectNote}
          onConfirmReject={confirmReject}
          busyId={busyId}
        />
      )}

      {viewingLiveAd && (
        <LiveAdDetailModal
          ad={viewingLiveAd}
          onClose={() => setViewingLiveAd(null)}
          onRenew={(ad) => setRenewingAd(ad)}
          onEnd={(ad) => setEndingAd(ad)}
          busyId={busyId}
        />
      )}

      {viewingExpiredAd && (
        <ExpiredAdDetailModal
          ad={viewingExpiredAd}
          onClose={() => setViewingExpiredAd(null)}
          onRenew={(ad) => setRenewingAd(ad)}
          busyId={busyId}
        />
      )}

      {viewingRejected && (
        <RejectedDetailModal
          inquiry={viewingRejected}
          onClose={() => setViewingRejected(null)}
        />
      )}

      {publishingInquiry && (
        <PublishModal
          inquiry={publishingInquiry}
          onClose={() => setPublishingInquiry(null)}
          onPublish={handlePublish}
        />
      )}

      {endingAd && (
        <EndAdvertisementModal
          ad={endingAd}
          onClose={() => setEndingAd(null)}
          onConfirm={(id, note) => handleEndAd(id, note)}
          busy={busyId === endingAd.id}
        />
      )}

      {renewingAd && (
        <RenewModal
          ad={renewingAd}
          onClose={() => setRenewingAd(null)}
          onConfirm={(id, durationDays, notes) => handleRenewAd(id, durationDays, notes)}
          busy={busyId === renewingAd.id}
        />
      )}
    </div>
  );
}