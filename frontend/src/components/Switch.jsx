export default function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative w-8 h-4 rounded-full transition-colors outline-none
        focus-visible:ring-2 focus-visible:ring-primary/50
        ${checked ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"}
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          absolute top-0.5 size-3 bg-white rounded-full transition-all shadow-sm
          ${checked ? "left-4" : "left-0.5"}
        `}
      />
    </button>
  );
}
