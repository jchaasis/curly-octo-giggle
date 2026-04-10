import { useCallback, useEffect, useRef } from 'react';

// Inner padding in pixels applied to all four edges of the canvas drawing area.
const PADDING = 4;

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

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    if (readings.length < 2) return;

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const range = max - min || 1;

    const xStep = (width - PADDING * 2) / (readings.length - 1);
    // Canvas Y=0 is the top edge; subtract to flip so higher values render higher on screen.
    const yScale = (height - PADDING * 2) / range;

    const points = readings.map((v, i) => ({
      x: PADDING + i * xStep,
      y: height - PADDING - (v - min) * yScale,
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,245,255,0.25)');
    gradient.addColorStop(1, 'rgba(0,245,255,0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    // Close fill path to bottom
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.lineTo(points[0].x, height);
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
