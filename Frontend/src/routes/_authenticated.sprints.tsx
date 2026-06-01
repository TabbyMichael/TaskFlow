import { createFileRoute } from "@tanstack/react-router";
import { SprintsPage } from "@/features/sprints/pages/sprints-page";
export const Route = createFileRoute("/_authenticated/sprints")({ component: SprintsPage });
