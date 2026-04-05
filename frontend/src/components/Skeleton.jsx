/**
 * Skeleton.jsx — Loading skeleton components
 *
 * FIX 6: Skeleton loaders on all pages, no blank white screens
 * FIX 7: Uses only standard CSS — works on Chrome + Edge
 *
 * Exports:
 *  - SkeletonBlock (default)     — generic shimmer block
 *  - TripCardSkeleton            — boarding-pass card
 *  - StatCardSkeleton            — dashboard stat card
 *  - TripDetailSkeleton          — full trip detail page skeleton
 *  - ItinerarySkeleton           — itinerary page skeleton
 *  - PageSpinner                 — centered spinner for page transitions
 */

/* ─── Base shimmer block ─── */
function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`bg-border-light rounded animate-pulse ${className}`}
      style={style}
    />
  );
}

/* ─── Boarding Pass Card Skeleton ─── */
export function TripCardSkeleton() {
  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Photo strip skeleton */}
      <SkeletonBlock className="h-32 w-full rounded-none" />

      {/* Body */}
      <div className="px-4 pt-4 pb-3">
        {/* Date row */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <SkeletonBlock className="h-2 w-10 mb-1.5" />
            <SkeletonBlock className="h-4 w-14" />
          </div>
          <SkeletonBlock className="h-0.5 flex-1 mx-4" />
          <div>
            <SkeletonBlock className="h-2 w-10 mb-1.5 ml-auto" />
            <SkeletonBlock className="h-4 w-14 ml-auto" />
          </div>
        </div>

        {/* Duration chip */}
        <div className="flex justify-center mb-3">
          <SkeletonBlock className="h-4 w-16 rounded-full" />
        </div>

        {/* Tear line */}
        <div className="relative my-3">
          <SkeletonBlock className="h-0.5 w-full" />
        </div>

        {/* Budget section */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <div>
              <SkeletonBlock className="h-2 w-8 mb-1.5" />
              <SkeletonBlock className="h-5 w-16" />
            </div>
            <div>
              <SkeletonBlock className="h-2 w-8 mb-1.5 ml-auto" />
              <SkeletonBlock className="h-5 w-16 ml-auto" />
            </div>
          </div>
          <SkeletonBlock className="h-2 w-full rounded-full" />
          <div className="flex justify-between mt-1.5">
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-3">
          <SkeletonBlock className="flex-1 h-9 rounded-lg" />
          <SkeletonBlock className="flex-1 h-9 rounded-lg" />
          <SkeletonBlock className="w-9 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Card Skeleton ─── */
export function StatCardSkeleton() {
  return (
    <div
      className="bg-card rounded-xl p-4 text-center border border-border animate-pulse"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <SkeletonBlock className="h-8 w-12 mx-auto mb-2" />
      <SkeletonBlock className="h-3 w-16 mx-auto" />
    </div>
  );
}

/* ─── Trip Detail Page Skeleton ─── */
export function TripDetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        {/* Back link */}
        <SkeletonBlock className="h-4 w-32 mb-6 rounded" />

        <div className="grid gap-6 md:grid-cols-5">
          {/* Left column */}
          <div className="space-y-6 md:col-span-3">
            {/* Trip header card */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <SkeletonBlock className="h-7 w-2/3 mb-2 rounded" />
              <SkeletonBlock className="h-4 w-1/3 mb-4 rounded" />
              <div className="flex gap-2 mb-4">
                <SkeletonBlock className="h-5 w-16 rounded-full" />
                <SkeletonBlock className="h-5 w-28 rounded-full" />
                <SkeletonBlock className="h-5 w-14 rounded-full" />
              </div>
              <SkeletonBlock className="h-3 w-full rounded-full mb-2" />
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-20 rounded" />
                <SkeletonBlock className="h-3 w-20 rounded" />
              </div>
            </div>

            {/* Budget tracker card */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <SkeletonBlock className="h-5 w-40 mb-4 rounded" />
              <SkeletonBlock className="h-48 w-full rounded-lg" />
            </div>

            {/* Expenses card */}
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <SkeletonBlock className="h-5 w-32 mb-4 rounded" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="w-8 h-8 rounded-full" />
                    <div>
                      <SkeletonBlock className="h-4 w-28 mb-1 rounded" />
                      <SkeletonBlock className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <SkeletonBlock className="h-5 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-6">
            <SkeletonBlock className="h-64 w-full rounded-xl" />
            <div className="bg-card rounded-xl p-6 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <SkeletonBlock className="h-5 w-32 mb-4 rounded" />
              {[1, 2, 3].map(i => (
                <SkeletonBlock key={i} className="h-20 w-full rounded-xl mb-3" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Itinerary Page Skeleton ─── */
export function ItinerarySkeleton() {
  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <SkeletonBlock className="h-4 w-28 mb-6 rounded" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <SkeletonBlock className="h-7 w-40 mb-2 rounded" />
            <SkeletonBlock className="h-4 w-56 rounded" />
          </div>
          <SkeletonBlock className="h-9 w-24 rounded-lg" />
        </div>
        {[1, 2].map(g => (
          <div key={g} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <SkeletonBlock className="h-7 w-16 rounded-full" />
              <SkeletonBlock className="h-0.5 flex-1 rounded" />
            </div>
            {[1, 2].map(i => (
              <SkeletonBlock key={i} className="h-20 w-full rounded-xl mb-3" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Centered page spinner ─── */
export function PageSpinner({ message = 'Loading...' }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg page-content"
      role="status"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Standard border spinner — no Chrome-only features */}
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
        <p
          className="text-text-secondary text-sm font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default SkeletonBlock;
