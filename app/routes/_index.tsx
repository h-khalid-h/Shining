import type { Route } from './+types/_index';
import { Header } from '~/components/header/Header';
import { IntelligenceLayer } from '~/components/intelligence/IntelligenceLayer';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <IntelligenceLayer>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Shining</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your intelligent outcome platform powered by AI
            </p>
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Intelligence Layer Active</h2>
              <p className="text-sm text-gray-700">
                The intelligence components are now integrated and ready to enhance your experience.
              </p>
            </div>
          </div>
        </div>
      </IntelligenceLayer>
    </div>
  );
}
