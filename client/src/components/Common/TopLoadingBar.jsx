import { useLoadingStore } from '../../store/loadingStore';

export default function TopLoadingBar() {
  const { progress, visible } = useLoadingStore();

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 999999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 35%, #38bdf8 70%, #10b981 100%)',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.8), 0 0 6px rgba(56, 189, 248, 0.6)',
          borderRadius: '0 2px 2px 0',
          transition: progress === 100 ? 'width 150ms ease-out, opacity 250ms ease-in' : 'width 200ms cubic-bezier(0.1, 0.5, 0.1, 1)',
          opacity: visible ? 1 : 0,
          position: 'relative',
        }}
      >
        {/* Glow head */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '-2px',
            bottom: '-2px',
            width: '80px',
            background: 'radial-gradient(ellipse at right, rgba(255, 255, 255, 0.9) 0%, rgba(56, 189, 248, 0.4) 40%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
      </div>
    </div>
  );
}
