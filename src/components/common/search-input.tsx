import { SearchIcon } from 'lucide-react';
import { Input } from '../ui/input';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'sm' | 'normal';
}

export function SearchInput({ className, ...props }: InputProps) {
  return (
    <div className="relative flex items-center justify-center">
      <SearchIcon className="absolute top-3 left-2.5 size-4 text-muted-foreground" />
      <Input className={`pl-9 ${className}`} placeholder="Search" {...props} />
    </div>
  );
}
