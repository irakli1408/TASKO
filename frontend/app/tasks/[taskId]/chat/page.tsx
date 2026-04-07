import { TaskChatViewV2 } from "@/components/task-chat-view-v2";

type TaskChatPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskChatPage({ params }: TaskChatPageProps) {
  const resolvedParams = await params;
  const taskId = Number(resolvedParams.taskId);

  if (!Number.isFinite(taskId)) {
    return null;
  }

  return <TaskChatViewV2 taskId={taskId} />;
}
