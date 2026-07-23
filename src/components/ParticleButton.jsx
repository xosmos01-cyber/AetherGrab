import React, { useRef, useState } from 'react';
import { MousePointerClick, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function SuccessParticles({ buttonRef }) {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return (
    <AnimatePresence>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = Math.random() * 45 + 25;
        const xTarget = Math.cos(angle) * distance;
        const yTarget = Math.sin(angle) * distance - 10;

        return (
          <motion.div
            key={i}
            initial={{
              scale: 0,
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              scale: [0, 1.5, 0],
              x: [0, xTarget],
              y: [0, yTarget],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.6,
              delay: i * 0.05,
              ease: "easeOut",
            }}
            className="fixed h-1.5 w-1.5 rounded-full bg-blue-400 dark:bg-white shadow-[0_0_8px_#3b82f6] pointer-events-none z-50"
            style={{ left: centerX, top: centerY }}
          />
        );
      })}
    </AnimatePresence>
  );
}

export default function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 1000,
  className = '',
  disabled = false,
  ...props
}) {
  const [showParticles, setShowParticles] = useState(false);
  const buttonRef = useRef(null);

  const handleClick = async (e) => {
    if (disabled) return;
    setShowParticles(true);

    if (onClick) {
      onClick(e);
    }
    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      setShowParticles(false);
    }, successDuration);
  };

  return (
    <>
      {showParticles && (
        <SuccessParticles buttonRef={buttonRef} />
      )}
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-medium text-xs border border-blue-400/30 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] active:scale-95 select-none overflow-hidden ${
          showParticles ? 'scale-95' : ''
        } ${className}`}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 fill-current text-blue-200" />
            <span>Quick Download</span>
            <MousePointerClick className="h-3.5 w-3.5 ml-0.5 text-blue-200" />
          </>
        )}
      </button>
    </>
  );
}
