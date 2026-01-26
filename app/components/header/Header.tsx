interface HeaderProps {
  onOpenDashboard?: () => void;
  showDashboardButton?: boolean;
}

export function Header({ onOpenDashboard, showDashboardButton = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between bg-bolt-elements-background-depth-1 p-5 border-b border-bolt-elements-borderColor">
      <div className="flex items-center gap-4">
        <a href="/" className="text-2xl font-semibold text-bolt-elements-textPrimary">
          Gence
        </a>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-bolt-elements-textSecondary">
          Intelligent Outcome Platform
        </span>
        {showDashboardButton && onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor transition-colors"
            title="Intelligence Dashboard (Cmd+D)"
            aria-label="Open Intelligence Dashboard"
          >
            <div className="i-ph:brain text-lg text-bolt-elements-textPrimary" />
            <span className="text-sm font-medium text-bolt-elements-textPrimary hidden md:inline">
              Dashboard
            </span>
            <span className="text-xs text-bolt-elements-textTertiary hidden lg:inline">
              ⌘D
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

