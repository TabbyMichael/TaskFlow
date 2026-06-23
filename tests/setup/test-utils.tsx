import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function Providers({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

/** Render a component with the app's query + tooltip providers (no router). */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...options }),
  };
}

/**
 * Mount a component inside a real TanStack Router memory router so router hooks
 * (useNavigate, Link, useParams, ...) work. Returns the router so tests can
 * assert on the current location.
 */
export async function renderWithRouter(
  Component: () => ReactElement,
  opts: { initialEntries?: string[]; path?: string } = {},
) {
  const { initialEntries = ["/"], path = "/" } = opts;
  const queryClient = createTestQueryClient();

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <Component />
        </TooltipProvider>
      </QueryClientProvider>
    ),
  });

  // A catch-all child so navigation to arbitrary paths resolves without 404s.
  const catchAll = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => null,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([catchAll]),
    history: createMemoryHistory({ initialEntries }),
  });

  void path;
  const utils = render(
    <RouterProvider router={router as never} />,
  );
  await router.load();
  return { router, user: userEvent.setup(), ...utils };
}

export * from "@testing-library/react";
export { userEvent };
