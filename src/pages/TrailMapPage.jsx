/**
 * TrailMapPage Component
 *
 * Page wrapper for the Trail Map with clean, minimal background
 */

import { Link } from 'react-router-dom';
import TrailMap from '../components/trail/TrailMap';

const TrailMapPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle accent stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation bar */}
      <div className="relative z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
          >
            <span className="text-xl">&#8592;</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Learning Trail</h1>
          <Link
            to="/practice-modes"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            Free Practice
          </Link>
        </div>
      </div>

      {/* Trail content */}
      <TrailMap />

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default TrailMapPage;
