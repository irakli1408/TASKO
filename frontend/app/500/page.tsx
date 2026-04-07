import { ErrorStatePage } from "@/components/error-state-page";

export default function InternalServerErrorPage() {
  return (
    <ErrorStatePage
      code="500"
      title="Something went wrong"
      description="Tasko could not complete this action because an unexpected internal error happened. Return to a stable page and try again."
      primaryHref="/"
      secondaryHref="/notifications"
      secondaryLabel="Open notifications"
    />
  );
}
