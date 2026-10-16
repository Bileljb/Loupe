import { notFound } from "next/navigation";

// Any path that matches no page renders the localized not-found.tsx with a real 404.
export default function CatchAll() {
  notFound();
}
