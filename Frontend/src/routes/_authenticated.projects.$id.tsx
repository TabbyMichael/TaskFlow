import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailsPage } from "@/features/projects/pages/project-details-page";
export const Route = createFileRoute("/_authenticated/projects/$id")({ component: ProjectDetailsPage });
