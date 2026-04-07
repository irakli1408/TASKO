import { ExecutorPublicProfileView } from "@/components/executor-public-profile-view";

type ExecutorProfilePageProps = {
  params: Promise<{
    executorId: string;
  }>;
};

export default async function ExecutorProfilePage({ params }: ExecutorProfilePageProps) {
  const { executorId } = await params;
  const parsedExecutorId = Number(executorId);

  return <ExecutorPublicProfileView executorId={parsedExecutorId} />;
}
