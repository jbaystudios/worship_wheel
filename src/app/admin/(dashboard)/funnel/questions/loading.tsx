import { Skeleton } from '@/components/admin/states/Skeleton';

export default function Loading() {
  return (
    <section className="flex flex-col gap-space-5">
      <Skeleton.Header />
      <Skeleton.List rows={16} />
    </section>
  );
}
