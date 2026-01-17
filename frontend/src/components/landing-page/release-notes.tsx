"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";

interface Release {
  tag_name: string;
  published_at: string;
  body?: string;
}

export function ReleaseNotes() {
  const [release, setRelease] = useState<Release | null>(null);

  useEffect(() => {
    fetch("/api/latest-release")
      .then((res) => res.json())
      .then((data) => setRelease(data));
  }, []);

  if (!release) return null;

  return (
    <div className="mt-16 p-6 border border-gray-800 rounded-xl bg-gray-900 " >
      <h2 className="text-2xl font-bold">Latest Release — {release.tag_name}</h2>
      <p className="text-gray-400 text-sm">
        Published: {new Date(release.published_at).toLocaleDateString()}
      </p>

      <div
        className="prose prose-invert mt-4"
        dangerouslySetInnerHTML={{ __html: marked(release.body || "") }}
      />
    </div>
  );
}
