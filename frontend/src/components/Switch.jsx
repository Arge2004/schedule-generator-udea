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
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent  duration-200 ease-in-out outline-none
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900
        ${checked ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${checked ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}
