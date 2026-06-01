import { createFileRoute } from "@tanstack/react-router";
import { KanbanPage } from "@/features/kanban/pages/kanban-page";
export const Route = createFileRoute("/_authenticated/kanban")({ component: KanbanPage });
