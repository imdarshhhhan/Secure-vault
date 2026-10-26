import { SearchIcon, XIcon } from './icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search by site or username' }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-500">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search saved passwords"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-500 hover:text-ink-900"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
