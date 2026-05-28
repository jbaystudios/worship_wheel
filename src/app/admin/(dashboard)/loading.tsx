// Funnel overview skeleton — shaped to match the final layout (KPI row,
// funnel chart, biggest-drop-off callout). Spec 007 US5 acceptance scenario 3.
import { Skeleton } from '@/components/admin/states/Skeleton';

export default function Loading() {
  return (
    <section className="flex flex-col gap-space-5">
      <Skeleton.Header />
      <div className="flex flex-wrap gap-space-4">
        <Skeleton.Tile />
        <Skeleton.Tile />
        <Skeleton.Tile />
        <Skeleton.Tile />
      </div>
      <Skeleton.Chart height={220} />
      <Skeleton.Box className="h-24 w-full rounded-md" />
    </section>
  );
}
