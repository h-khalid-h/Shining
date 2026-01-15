import type { Route } from './+types/test';

export const meta: Route.MetaFunction = () => {
    return [{ title: 'Test Route' }];
};

export default function Test() {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Route - Minimal Component</h1>
            <p>If you see this, React Router is working!</p>
        </div>
    );
}
