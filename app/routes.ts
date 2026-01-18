import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/_index.tsx'),
    route('chat/:id', 'routes/chat.$id.tsx'),
    route('test', 'routes/test.tsx'),

    // Auth & Onboarding
    route('login', 'routes/login.tsx'),
    route('sign-up', 'routes/sign-up.tsx'),
    route('onboarding', 'routes/onboarding.tsx'),
    // API routes
    route('api/chat', 'routes/api.chat.ts'),
    route('api/vectors/generate', 'routes/api.vectors.generate.ts'),
    route('api/enhancer', 'routes/api.enhancer.ts'),
    route('api/graph/active', 'routes/api.graph.active.ts'),
    route('api/graph/kinetics/:northId', 'routes/api.graph.kinetics.ts'),
    route('api/graph/decisions/:northId', 'routes/api.graph.decisions.ts'),
    route('api/graph/bounds', 'routes/api.graph.bounds.ts'),
    route('api/graph/signal', 'routes/api.graph.signal.ts'),
    route('api/graph/:northId', 'routes/api.graph.$northId.ts'),
    route('api/graph/:northId/signal', 'routes/api.graph.$northId.signal.ts'),
] satisfies RouteConfig;

