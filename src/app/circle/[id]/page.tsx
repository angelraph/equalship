import { CircleView } from "@/components/CircleView";

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return <p className="card">That circle link is not valid.</p>;
  return <CircleView id={BigInt(id)} />;
}
