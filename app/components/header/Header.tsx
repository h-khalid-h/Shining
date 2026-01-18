export function Header() {
  return (
    <header className="flex items-center justify-between bg-white p-5 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <a href="/" className="text-2xl font-semibold text-blue-600">
          Gence
        </a>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Intelligent Outcome Platform
        </span>
      </div>
    </header>
  );
}

