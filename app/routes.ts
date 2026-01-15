import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/_index.tsx'),
    route('chat/:id', 'routes/chat.$id.tsx'),
    route('test', 'routes/test.tsx'),
    // API routes
    route('api/chat', 'routes/api.chat.ts'),
    route('api/vectors/generate', 'routes/api.vectors.generate.ts'),
    route('api/enhancer', 'routes/api.enhancer.ts'),
    route('api/graph/active', 'routes/api.graph.active.ts'),
    route('api/graph/:northId', 'routes/api.graph.$northId.ts'),
    route('api/graph/:northId/signal', 'routes/api.graph.$northId.signal.ts'),
] satisfies RouteConfig;

