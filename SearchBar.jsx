import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-3 h-12 px-4 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher dans les notes..."
          autoFocus
          className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-base"
        />
      </div>
    </div>
  );
}
