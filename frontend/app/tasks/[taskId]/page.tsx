import { TaskDetailsView } from "@/components/task-details-view";

type TaskPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { taskId } = await params;
  const parsedTaskId = Number(taskId);

  return <TaskDetailsView taskId={parsedTaskId} />;
}
