'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from './ChatDescription';
import { HeaderActionButtons } from './HeaderActionButtons.client';

export function HeaderClient() {
    const [isClient, setIsClient] = useState(false);
    const chat = useStore(chatStore);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <header
            className={classNames(
                'flex items-center justify-between bg-white p-5 border-b border-gray-200',
                {
                    'border-gray-300': chat.started,
                },
            )}
        >
            <div className="flex items-center gap-4">
                <a href="/" className="text-2xl font-semibold text-blue-600">
                    Shining
                </a>
                {isClient && <ChatDescription />}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                    Intelligent Outcome Platform
                </span>
                {isClient && <HeaderActionButtons />}
            </div>
        </header>
    );
}
