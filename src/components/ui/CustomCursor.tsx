"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Don't render on touch / pointer-coarse devices (mobile, tablets)
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // Use motion values for 60fps tracking without React re-renders
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring animation for the outer ring's trailing effect
  const springConfig = { damping: 25, stiffness: 400, mass: 0.3 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if we are hovering a clickable element or interactive text
      if (
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Hide default cursor within the OS shell, allowing opt-out via data-native-cursor */}
      <style>{`
        [data-asterix-shell] *:not([data-native-cursor], [data-native-cursor] *) {
          cursor: none !important;
        }
      `}</style>

      {/* Exact position dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-cyan-glowing rounded-full pointer-events-none z-99999 shadow-[0_0_8px_rgba(0,229,255,0.8)]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          scale: isHovering ? 0 : 1
        }}
        transition={{ scale: { type: "tween", duration: 0.15 } }}
      />

      {/* Trailing smooth ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-emerald-burnt rounded-full pointer-events-none z-99998"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? "rgba(35, 134, 92, 0.2)" : "rgba(35, 134, 92, 0)",
          borderColor: isHovering ? "rgba(0, 229, 255, 0.5)" : "rgba(35, 134, 92, 1)"
        }}
        transition={{ scale: { type: "spring", stiffness: 300, damping: 20 }, backgroundColor: { duration: 0.2 } }}
      />
    </>
  );
}
