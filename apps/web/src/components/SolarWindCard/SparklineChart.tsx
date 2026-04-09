import { useCallback, useEffect, useRef } from 'react';

interface SparklineChartProps {
  readings: number[];
}

export function SparklineChart({ readings }: SparklineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    if (readings.length < 2) return;

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const range = max - min || 1;
    const pad = 4;

    const xStep = (w - pad * 2) / (readings.length - 1);
    const yScale = (h - pad * 2) / range;

    const points = readings.map((v, i) => ({
      x: pad + i * xStep,
      y: h - pad - (v - min) * yScale,
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0,245,255,0.25)');
    gradient.addColorStop(1, 'rgba(0,245,255,0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    // Close fill path to bottom
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.lineTo(points[0].x, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#00F5FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [readings]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 52, display: 'block', marginTop: 4 }}
    />
  );
}
