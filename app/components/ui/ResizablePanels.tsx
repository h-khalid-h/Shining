import { useState, useRef, useEffect } from 'react';

interface ResizablePanelsProps {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    defaultLeftWidth?: number; // Percentage
    minLeftWidth?: number; // Percentage
    maxLeftWidth?: number; // Percentage
}

/**
 * Resizable panels component with drag-to-resize functionality.
 * Features:
 * - Mobile responsive (hides right panel below 768px)
 * - Keyboard accessible (arrow keys + Enter to reset)
 * - Larger hit area for easier resizing
 * - Persists user's width preference to localStorage
 */
export function ResizablePanels({
    leftPanel,
    rightPanel,
    defaultLeftWidth = 50,
    minLeftWidth = 30,
    maxLeftWidth = 70,
}: ResizablePanelsProps) {
    const [leftWidth, setLeftWidth] = useState(() => {
        // Load from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('meldon-chat-width');
            return saved ? parseInt(saved, 10) : defaultLeftWidth;
        }
        return defaultLeftWidth;
    });

    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const updateWidth = (newWidth: number) => {
        const constrainedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
        setLeftWidth(constrainedWidth);
        localStorage.setItem('meldon-chat-width', constrainedWidth.toString());
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const step = 5; // 5% per keypress

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                updateWidth(leftWidth - step);
                break;
            case 'ArrowRight':
                e.preventDefault();
                updateWidth(leftWidth + step);
                break;
            case 'Enter':
                e.preventDefault();
                updateWidth(defaultLeftWidth);
                break;
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;

            const container = containerRef.current.getBoundingClientRect();
            const newWidth = ((e.clientX - container.left) / container.width) * 100;
            updateWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [minLeftWidth, maxLeftWidth]);

    // Mobile: show only left panel
    if (isMobile) {
        return (
            <div className="w-full h-full">
                {leftPanel}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex w-full h-full">
            {/* Left panel (Chat) */}
            <div
                style={{ width: `${leftWidth}%` }}
                className="h-full overflow-hidden"
            >
                {leftPanel}
            </div>

            {/* Resize handle with larger hit area */}
            <div
                ref={resizerRef}
                onMouseDown={handleMouseDown}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                className="relative w-1 bg-bolt-elements-borderColor hover:bg-bolt-elements-borderColorActive cursor-col-resize transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                role="separator"
                aria-label="Resize panels (use arrow keys or drag)"
                aria-orientation="vertical"
                aria-valuenow={leftWidth}
                aria-valuemin={minLeftWidth}
                aria-valuemax={maxLeftWidth}
            >
                {/* Expanded hit area (invisible) */}
                <div className="absolute inset-y-0 -left-[5px] -right-[5px] w-[12px]" />

                {/* Visual indicator on hover */}
                <div className="w-full h-full hover:bg-blue-500 transition-colors opacity-0 hover:opacity-50" />
            </div>

            {/* Right panel (Workbench) */}
            <div
                style={{ width: `${100 - leftWidth - 0.5}%` }}
                className="h-full overflow-hidden"
            >
                {rightPanel}
            </div>
        </div>
    );
}
