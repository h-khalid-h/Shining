'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/react-router';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from './ChatDescription';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ProjectSwitcher } from '~/components/projects/ProjectSwitcher';

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
                {isClient && <ProjectSwitcher />}
                <a href="/" className="text-2xl font-semibold text-blue-600">
                    Meldon
                </a>
                {isClient && <ChatDescription />}
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    Intelligent Outcome Platform
                </span>
                {isClient && <HeaderActionButtons />}
                {isClient && (
                    <>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </>
                )}
            </div>
        </header>
    );
}
