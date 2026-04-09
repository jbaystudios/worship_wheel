import type { ChecklistItem } from '@/types';

interface ChecklistCardProps {
  questionText: string;
  items: ChecklistItem[];
  checkedIndices: number[];
  onChange: (indices: number[]) => void;
}

export function ChecklistCard({
  questionText,
  items,
  checkedIndices,
  onChange,
}: ChecklistCardProps) {
  function toggleItem(index: number) {
    if (checkedIndices.includes(index)) {
      onChange(checkedIndices.filter((i) => i !== index));
    } else {
      onChange([...checkedIndices, index]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-space-5 max-md:gap-space-4 rounded-md bg-theme-bg-2 p-space-7 max-md:p-space-4">
      <h2 className="text-h5 max-md:text-h6 max-md:text-center font-bold">
        {questionText}
      </h2>
      <p className="text-text-sm font-medium text-accent-400">
        Select all that apply
      </p>
      <div className="flex flex-col gap-space-2">
        {items.map((item) => {
          const isChecked = checkedIndices.includes(item.index);
          return (
            <button
              key={item.index}
              type="button"
              onClick={() => toggleItem(item.index)}
              className={`flex w-full items-center gap-space-3 rounded-sm border p-space-3 text-left transition-colors cursor-pointer ${
                isChecked
                  ? 'border-accent-500 bg-accent-900 text-theme-text'
                  : 'border-neutral-700 bg-transparent text-theme-text-muted hover:border-accent-500/50'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[14px] font-bold transition-colors ${
                  isChecked
                    ? 'bg-accent-500 text-neutral-950'
                    : 'border-2 border-neutral-700'
                }`}
              >
                {isChecked && '✓'}
              </span>
              <span className="text-text-base max-md:text-text-sm">
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
