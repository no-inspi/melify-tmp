import React, { useRef, useState, useEffect } from 'react';

const MouseTracker = ({ children }) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isInsideContainer =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInsideContainer) {
          setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            visible: true,
          });
        } else {
          setPosition((prev) => ({ ...prev, visible: false }));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '50px auto',
        overflow: 'hidden',
      }}
    >
      {children}
      {position.visible && (
        <div
          style={{
            position: 'absolute',
            top: position.y - 10,
            left: position.x - 50,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transform: `translate(-50%, -50%)`,
          }}
        >
          {/* Circle */}
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--accent))',
            }}
           />
          {/* Triangle */}
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '20px solid hsl(var(--primary))',
            }}
           />
          {/* Square */}
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'hsl(var(--black-background))',
            }}
           />
        </div>
      )}
    </div>
  );
};

export default MouseTracker;
