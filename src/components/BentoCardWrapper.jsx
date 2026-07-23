import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function BentoCardWrapper({ children, className = '' }) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      className={`h-full ${className}`}
      onHoverEnd={handleMouseLeave}
      onHoverStart={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ y: -5 }}
    >
      <div
        className="group relative flex h-full flex-col gap-4 rounded-xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900/60 via-neutral-900/40 to-neutral-900/30 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.2)] backdrop-blur-[4px] transition-all duration-500 ease-out before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-black/10 before:via-black/20 before:to-transparent before:opacity-100 before:transition-opacity before:duration-500 after:absolute after:inset-0 after:z-[-1] after:rounded-xl after:bg-neutral-900/70 hover:border-neutral-700/50 hover:from-neutral-800/60 hover:via-neutral-800/30 hover:to-neutral-800/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
      >
        <div
          className="relative z-10 flex h-full flex-col justify-between"
          style={{ transform: 'translateZ(20px)' }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}
