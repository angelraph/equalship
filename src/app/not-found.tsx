import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-28 text-center">
      <LogoMark size={88} />
      <h1 className="display mt-8 text-5xl">This page left the circle</h1>
      <p className="mt-4 max-w-md text-muted">The link may be old or mistyped. Everything else is still here.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/circles" className="btn">
          Browse circles
        </Link>
      </div>
    </Container>
  );
}
