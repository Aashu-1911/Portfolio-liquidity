import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedSectionProps extends PropsWithChildren {
  className?: string;
  delay?: number;
}

export default function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.2, margin: "0px 0px -10% 0px" });
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (inView) setHasEntered(true);
  }, [inView]);

  const state = inView ? "visible" : hasEntered ? "out" : "hidden";

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={state}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        out: { opacity: 0.88, y: 6, scale: 0.99 },
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
