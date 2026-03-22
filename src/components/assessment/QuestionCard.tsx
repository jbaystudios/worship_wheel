import { AnswerOption } from './AnswerOption';

interface Option {
  letter: string;
  text: string;
}

interface QuestionCardProps {
  questionText: string;
  options: Option[];
  selectedOption: string | null;
  onSelect: (letter: string) => void;
}

export function QuestionCard({ questionText, options, selectedOption, onSelect }: QuestionCardProps) {
  return (
    <div className="flex w-full flex-col gap-space-6 max-md:gap-space-4 rounded-md bg-theme-bg-2 p-space-7 max-md:p-space-4">
      <h2 className="text-h5 max-md:text-h6 max-md:text-center font-bold">{questionText}</h2>
      <div className="flex flex-col gap-space-3 max-md:gap-space-2">
        {options.map((opt) => (
          <AnswerOption
            key={opt.letter}
            letter={opt.letter}
            text={opt.text}
            isSelected={selectedOption === opt.letter}
            onSelect={() => onSelect(opt.letter)}
          />
        ))}
      </div>
    </div>
  );
}
