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
      <Skeleton.Box className="h-32 w-full rounded-md" />
      <Skeleton.Box className="h-32 w-full rounded-md" />
    </section>
  );
}
