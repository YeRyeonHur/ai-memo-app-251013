// components/ui/dynamic-gradient-background.tsx
// 마우스 위치에 따른 동적 그라데이션 배경 컴포넌트
// 마우스 움직임에 따라 그라데이션 중심점이 변화하는 인터랙티브 배경
// 관련 파일: app/page.tsx, app/layout.tsx

'use client'

import { useEffect, useRef, useState } from 'react';

interface DynamicGradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function DynamicGradientBackground({ 
  children, 
  className = '' 
}: DynamicGradientBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(255, 182, 193, 0.8) 0%,
            rgba(255, 218, 185, 0.6) 25%,
            rgba(255, 239, 213, 0.4) 50%,
            rgba(240, 248, 255, 0.3) 75%,
            rgba(248, 250, 252, 0.1) 100%
          )
        `,
        transition: 'background 0.3s ease-out'
      }}
    >
      {/* 추가적인 그라데이션 레이어로 더 부드러운 효과 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at ${mousePosition.x}% ${mousePosition.y}%,
              rgba(255, 192, 203, 0.3) 0%,
              rgba(255, 228, 196, 0.2) 30%,
              rgba(255, 250, 240, 0.1) 60%,
              transparent 100%
            )
          `,
          transition: 'background 0.4s ease-out'
        }}
      />
      
      {/* 컨텐츠 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
