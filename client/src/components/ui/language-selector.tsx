import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from './dropdown-menu';
import { Button } from './button';
import { Languages } from 'lucide-react';
import { useLanguage, t } from '../../utils/language';

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, isRtl } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'minimal' ? (
          <button className="text-muted-foreground hover:text-foreground">
            <Languages className="size-4" />
            <span className="sr-only">Change language</span>
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
            <Languages className="h-4 w-4" />
            <span className="font-medium">{language === 'english' ? 'EN' : 'عر'}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={isRtl ? 'rtl' : ''}>
        <DropdownMenuItem 
          onClick={() => setLanguage('english')}
          className={language === 'english' ? 'bg-accent text-accent-foreground' : ''}
        >
          <span className={isRtl ? 'ml-2' : 'mr-2'}>🇺🇸</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('arabic')}
          className={language === 'arabic' ? 'bg-accent text-accent-foreground' : ''}
        >
          <span className={isRtl ? 'ml-2' : 'mr-2'}>🇸🇦</span>
          <span>العربية</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}