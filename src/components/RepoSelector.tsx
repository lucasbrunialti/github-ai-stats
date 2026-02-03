"use client";

import { useState } from "react";
import { Repository } from "@/types";

interface RepoSelectorProps {
  repos: Repository[];
  selectedRepos: string[];
  onSelectionChange: (repos: string[]) => void;
}

export function RepoSelector({
  repos,
  selectedRepos,
  onSelectionChange,
}: RepoSelectorProps) {
  const [filter, setFilter] = useState("");

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredNames = new Set(filteredRepos.map((r) => r.name));
  const allFilteredSelected = filteredRepos.length > 0 && filteredRepos.every((r) => selectedRepos.includes(r.name));

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      onSelectionChange(selectedRepos.filter((r) => !filteredNames.has(r)));
    } else {
      const existing = new Set(selectedRepos);
      const merged = [...selectedRepos, ...filteredRepos.filter((r) => !existing.has(r.name)).map((r) => r.name)];
      onSelectionChange(merged);
    }
  };

  const handleToggleRepo = (repoName: string) => {
    if (selectedRepos.includes(repoName)) {
      onSelectionChange(selectedRepos.filter((r) => r !== repoName));
    } else {
      onSelectionChange([...selectedRepos, repoName]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select Repositories ({selectedRepos.length} of {repos.length})
        </label>
        <button
          type="button"
          onClick={handleToggleAll}
          disabled={filteredRepos.length === 0}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {allFilteredSelected ? "Deselect" : "Select"}{filter ? ` ${filteredRepos.length} filtered` : " All"}
        </button>
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredRepos.map((repo) => (
          <label
            key={repo.name}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={selectedRepos.includes(repo.name)}
              onChange={() => handleToggleRepo(repo.name)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {repo.name}
                </span>
                {repo.private && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    Private
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-gray-500 truncate">
                  {repo.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
