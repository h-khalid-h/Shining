export function Header() {
  return (
    <header className="flex items-center bg-white p-5 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <a href="/" className="text-2xl font-semibold text-blue-600 flex items-center">
          Shining
        </a>
      </div>
      <span className="flex-1 px-4 truncate text-center text-gray-700">
        Intelligent Outcome Platform
      </span>
    </header>
  );
}
