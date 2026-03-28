/**
 * Skeleton — Loading skeleton components
 *
 * Provides shimmer/pulse animations for content placeholders
 * while data is being fetched. Used across the app.
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

export default SkeletonBlock;
