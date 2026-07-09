import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/c/$collectionId/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_protected/c/$collectionId/dashboard"!</div>;
}
