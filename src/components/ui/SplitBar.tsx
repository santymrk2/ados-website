"use client";

import { motion } from "framer-motion";

interface Segment {
  key: string;
  value: number;
  color: string;
}

/** Bar split into colored segments in proportion to their values (decorative: the data is also listed as text). */
export function SplitBar({ segments }: { segments: Segment[] }) {
  const visible = segments.filter((segment) => segment.value > 0);
  if (visible.length === 0) return null;

  return (
    <div className="flex h-2 gap-1" aria-hidden="true">
      {visible.map((segment, i) => (
        <motion.div
          key={segment.key}
          className="h-full origin-left rounded-full"
          style={{ flex: `${segment.value} 1 0%`, backgroundColor: segment.color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 + i * 0.08 }}
        />
      ))}
    </div>
  );
}
