import { TaskChatView } from "@/components/task-chat-view";

type TaskChatPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskChatPage({ params }: TaskChatPageProps) {
  const resolvedParams = await params;
  const taskId = Number(resolvedParams.taskId);

  if (!Number.isFinite(taskId)) {
    return null;
  }

  return <TaskChatView taskId={taskId} />;
}
