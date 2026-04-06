import { Suspense } from "react";
import { CreateTaskView } from "@/components/create-task-view";

export default function CreateTaskPage() {
  return (
    <Suspense fallback={null}>
      <CreateTaskView />
    </Suspense>
  );
}
