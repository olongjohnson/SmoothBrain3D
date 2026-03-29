import { useEditorStore, type AnimationType } from './store';

const animations: { id: AnimationType; label: string; emoji: string }[] = [
  { id: 'idle', label: 'Idle', emoji: '😺' },
  { id: 'walk', label: 'Walk', emoji: '🚶' },
  { id: 'run', label: 'Run', emoji: '🏃' },
  { id: 'runFast', label: 'Sprint', emoji: '💨' },
  { id: 'naruto', label: 'Naruto', emoji: '🍥' },
  { id: 'bark', label: 'Bark', emoji: '🗣️' },
  { id: 'vomit', label: 'Vomit', emoji: '🤮' },
  { id: 'shoot', label: 'Shoot', emoji: '🔫' },
];

export default function AnimationPanel() {
  const animation = useEditorStore((s) => s.animation);
  const setAnimation = useEditorStore((s) => s.setAnimation);

  return (
    <div className="absolute top-14 right-3 z-20 flex flex-col gap-1 bg-[#16162a]/90 backdrop-blur-md rounded-2xl border border-white/10 p-2 w-[100px]">
      <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest text-center mb-1">Anim</span>
      {animations.map(({ id, label, emoji }) => (
        <button
          key={id}
          onClick={() => setAnimation(id)}
          className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all
            ${animation === id
              ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
              : 'text-white/60 hover:bg-white/10 hover:text-white active:scale-95'
            }`}
        >
          <span className="text-sm">{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
