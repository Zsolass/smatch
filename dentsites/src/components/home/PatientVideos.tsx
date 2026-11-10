"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Picture } from "@/components/ui/Picture";
import type { PatientVideo } from "@/config/clinic";

/** Patient videos: only a poster image loads until the visitor presses play. */
export function PatientVideos({ videos }: { videos: PatientVideo[] }) {
  const [playing, setPlaying] = useState<number | null>(null);
  if (!videos.length) return null;
  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, i) => (
        <li key={video.src} className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-night-soft">
          {playing === i ? (
            video.kind === "embed" ? (
              <iframe src={video.src} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
            ) : (
              <video src={video.src} controls autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
            )
          ) : (
            <button type="button" onClick={() => setPlaying(i)} className="group absolute inset-0 text-left" aria-label={`Play video: ${video.title}`}>
              <Picture image={video.poster} alt="" sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/35">
                <span className="grid size-16 place-items-center rounded-full bg-white text-night shadow-lg">
                  <Icon name="play" className="size-6" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 font-semibold text-white">{video.title}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
