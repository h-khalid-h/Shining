import type { Route } from './+types/_index';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full p-8">
      <h1 className="text-3xl font-bold mb-4">Shining Platform</h1>
      <p className="text-lg">Intelligent outcome platform powered by AI</p>
      <p className="mt-4 text-sm text-gray-600">
        The application is undergoing React Router v7 migration.
        <br />
        Core functionality will be restored shortly.
      </p>
    </div>
  );
}
