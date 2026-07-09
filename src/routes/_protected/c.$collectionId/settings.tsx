import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/c/$collectionId/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_protected/c/$collectionId/settings"!</div>;
}
