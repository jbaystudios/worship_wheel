interface AnswerOptionProps {
  letter: string;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function AnswerOption({ letter, text, isSelected, onSelect }: AnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-space-3 rounded-sm border p-space-4 max-md:p-space-3 max-md:flex-col max-md:items-center max-md:text-center max-md:gap-space-2 text-left transition-colors cursor-pointer ${
        isSelected
          ? 'border-accent-500 bg-accent-500 text-neutral-950'
          : 'border-theme-bg-2 bg-transparent hover:border-accent-500/50'
      }`}
    >
      <span
        className={`flex h-8 w-8 max-md:h-6 max-md:w-6 shrink-0 items-center justify-center rounded-full text-text-sm font-bold ${
          isSelected
            ? 'bg-neutral-950 text-accent-500'
            : 'border border-theme-text text-theme-text'
        }`}
      >
        {letter}
      </span>
      <span className="text-text-base max-md:text-text-sm">{text}</span>
    </button>
  );
}
