import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/_index.tsx'),
    route('chat/:id', 'routes/chat.$id.tsx'),
    route('test', 'routes/test.tsx'),
] satisfies RouteConfig;
