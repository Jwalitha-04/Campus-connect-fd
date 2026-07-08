"use client";

import React, { useState, useEffect } from "react";

interface MatchPair {
  lostId: string;
  foundId: string;
}

interface StringOverlayProps {
  matches: MatchPair[];
  boardRef: React.RefObject<HTMLDivElement | null>;
}

interface Connection {
  id: string;
  path: string;
}

export default function StringOverlay({ matches, boardRef }: StringOverlayProps) {
  const [connections, setConnections] = useState<Connection[]>([]);

  const calculatePaths = () => {
    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const newConnections: Connection[] = [];

    matches.forEach(({ lostId, foundId }) => {
      // Find the main pod card elements
      const elA = document.getElementById(`item-lost-${lostId}`);
      const elB = document.getElementById(`item-found-${foundId}`);

      if (elA && elB) {
        const rectA = elA.getBoundingClientRect();
        const rectB = elB.getBoundingClientRect();

        // Calculate centers of pods relative to the board container bounds
        const xA = rectA.left + rectA.width / 2 - boardRect.left;
        const yA = rectA.top + rectA.height / 2 - boardRect.top;

        const xB = rectB.left + rectB.width / 2 - boardRect.left;
        const yB = rectB.top + rectB.height / 2 - boardRect.top;

        // Gentle organic wobble instead of a taut catenary
        const midX = (xA + xB) / 2 + (yA - yB) * 0.15;
        const midY = (yA + yB) / 2 + 40;

        const path = `M ${xA} ${yA} Q ${midX} ${midY} ${xB} ${yB}`;
        newConnections.push({
          id: `${lostId}-${foundId}`,
          path,
        });
      }
    });

    setConnections(newConnections);
  };

  // Recalculate on mount, resize, matches change, and font load
  useEffect(() => {
    calculatePaths();

    window.addEventListener("resize", calculatePaths);

    if (document.fonts) {
      document.fonts.ready.then(calculatePaths);
    }

    const timer = setTimeout(calculatePaths, 400);

    return () => {
      window.removeEventListener("resize", calculatePaths);
      clearTimeout(timer);
    };
  }, [matches]);

  // Use MutationObserver to watch for masonry updates or filtering changes in children
  useEffect(() => {
    if (!boardRef.current) return;

    const observer = new MutationObserver(calculatePaths);
    observer.observe(boardRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [boardRef]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-15"
      style={{ minHeight: "100%" }}
    >
      <defs>
        <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF9A5A" />
          <stop offset="100%" stopColor="#4FD8A8" />
        </linearGradient>
      </defs>
      {connections.map((conn) => (
        <path
          key={conn.id}
          d={conn.path}
          stroke="url(#flowGrad)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="flow-path"
        />
      ))}
    </svg>
  );
}
