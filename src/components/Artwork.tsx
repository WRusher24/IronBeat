"use client";

import { useState } from "react";
import { IconBolt } from "./icons";

export function Artwork({ src, size, className = "" }: { src: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const style = size ? { width: size, height: size } : undefined;
  if (!src || failed) {
    return (
      <span
        style={style}
        className={`grid shrink-0 place-items-center overflow-hidden bg-accent/25 text-accent ${className}`}
        aria-hidden="true"
      >
        <IconBolt size={size ? Math.round(size * 0.4) : 20} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={style}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 bg-card-fg/10 object-cover ${className}`}
    />
  );
}
