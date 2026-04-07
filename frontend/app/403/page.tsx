import { ErrorStatePage } from "@/components/error-state-page";

export default function ForbiddenPage() {
  return (
    <ErrorStatePage
      code="403"
      title="Access denied"
      description="This section is not available for your current account or role. Return to a screen you already have access to and continue from there."
      primaryHref="/"
      secondaryHref="/profile"
      secondaryLabel="Open profile"
    />
  );
}
