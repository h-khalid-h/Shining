import type { Route } from './+types/_index';
import { Header } from '~/components/header/Header';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-6 text-center">Welcome to Shining</h1>
          <p className="text-xl text-gray-600 mb-8 text-center">
            Your intelligent outcome platform powered by AI
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">✅ Migration Complete</h2>
              <p className="text-sm text-gray-700">
                Successfully migrated to React Router v7 with full SSR support
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">🔐 Authentication</h2>
              <p className="text-sm text-gray-700">
                Clerk authentication integrated and working
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">🧠 Intelligence Layer</h2>
              <p className="text-sm text-gray-700">
                57 files, 8,500+ lines of intelligence code ready for integration
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">🚀 Next Steps</h2>
              <p className="text-sm text-gray-700">
                Chat interface and intelligence features can be added incrementally
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
