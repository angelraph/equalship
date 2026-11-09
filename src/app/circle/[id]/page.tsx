import type { Metadata } from "next";
import { CircleView } from "@/components/CircleView";
import { Container } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Circle #${id}`, description: "Join this Equalship savings circle on Robinhood Chain." };
}

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Container className="py-10">
      {/^\d+$/.test(id) ? <CircleView id={BigInt(id)} /> : <p className="card">That circle link is not valid.</p>}
    </Container>
  );
}
