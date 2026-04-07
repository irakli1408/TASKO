import { ErrorStatePage } from "@/components/error-state-page";

export default function NotFound() {
  return (
    <ErrorStatePage
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist anymore or the link is incorrect. Return to the Tasko workspace and continue from a known screen."
      primaryHref="/"
      secondaryHref="/feed"
      secondaryLabel="Open feed"
    />
  );
}
