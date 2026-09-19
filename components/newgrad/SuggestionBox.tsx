"use client";

import { useEffect, useRef, useState } from "react";

export function SuggestionBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) {
      setFeedback({ type: "error", message: "Please provide a hospital or health system name." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/newgrad/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_name: hospitalName,
          location,
          url,
          notes,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };

      if (!res.ok || !data.ok) {
        setFeedback({
          type: "error",
          message: data.error ?? "Could not save your suggestion. Please try again.",
        });
      } else {
        setFeedback({
          type: "success",
          message: "Thank you! Your suggestion is queued for our next daily research run.",
        });
        setHospitalName("");
        setLocation("");
        setUrl("");
        setNotes("");
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ng-suggest-container">
      <button
        type="button"
        className="ng-suggest-btn"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="ng-suggest-plus">+</span>
        <span>Suggest a Hospital</span>
      </button>

      {isOpen && (
        <div
          className="ng-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="ng-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ng-modal-title"
            ref={modalRef}
          >
            <div className="ng-modal-header">
              <div>
                <p className="ng-modal-eyebrow">COMMUNITY WATCHLIST</p>
                <h2 id="ng-modal-title" className="ng-modal-title">
                  Suggest a Hospital
                </h2>
              </div>
              <button
                type="button"
                className="ng-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="ng-modal-desc">
              Want us to track a hospital not currently listed? Submit the details below. Our daily
              automation will research official career sources and queue it for verified publication.
            </p>

            {feedback && (
              <div
                className={`ng-modal-alert ${
                  feedback.type === "success" ? "ng-alert-success" : "ng-alert-error"
                }`}
                role="alert"
              >
                {feedback.message}
              </div>
            )}

            {feedback?.type === "success" ? (
              <div className="ng-modal-actions-done">
                <button
                  type="button"
                  className="ng-btn-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </button>
                <button
                  type="button"
                  className="ng-btn-secondary"
                  onClick={() => setFeedback(null)}
                >
                  Suggest Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ng-modal-form">
                <label className="ng-modal-field">
                  <span className="ng-label-text">
                    Hospital or Health System Name <span className="ng-req">*</span>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Torrance Memorial Medical Center"
                    className="ng-modal-input"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </label>

                <label className="ng-modal-field">
                  <span className="ng-label-text">City, State</span>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Torrance, CA"
                    className="ng-modal-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>

                <label className="ng-modal-field">
                  <span className="ng-label-text">Careers or Residency URL</span>
                  <input
                    type="url"
                    maxLength={2000}
                    placeholder="https://..."
                    className="ng-modal-input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </label>

                <label className="ng-modal-field">
                  <span className="ng-label-text">Notes / Cohort Details</span>
                  <textarea
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g. They typically open applications in January for their Spring cohort."
                    className="ng-modal-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>

                <div className="ng-modal-footer">
                  <button
                    type="button"
                    className="ng-btn-secondary"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ng-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting…" : "Submit Suggestion"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
