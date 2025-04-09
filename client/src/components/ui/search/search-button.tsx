import React from 'react';
import { Button } from '../button';
import { Search } from 'lucide-react';
import { useSearch } from '../../../utils/search-context';
import { useLanguage } from '../../../utils/language';

interface SearchButtonProps {
  className?: string;
  responsive?: boolean;
}

// Custom translation function for the search button
const useButtonTranslation = () => {
  const { language } = useLanguage();
  
  const translations = {
    english: {
      search: 'Search',
      globalSearch: 'Global Search'
    },
    arabic: {
      search: 'بحث',
      globalSearch: 'بحث شامل'
    }
  };
  
  // Translation function
  const t = (key: keyof typeof translations.english): string => {
    const lang = language === 'english' ? 'english' : 'arabic';
    const translation = translations[lang][key];
    return typeof translation === 'string' ? translation : key;
  };
  
  return { t };
};

export const SearchButton = ({ 
  className = '',
  responsive = false
}: SearchButtonProps) => {
  const { toggleSearch } = useSearch();
  const { isRtl } = useLanguage();
  const { t } = useButtonTranslation();

  // For responsive design, we'll hide text on smaller screens
  const buttonText = responsive 
    ? <span className="hidden md:inline ml-2">{t('search')}</span>
    : <span className={isRtl ? 'mr-2' : 'ml-2'}>{t('search')}</span>;

  return (
    <Button
      variant="outline"
      className={`group ${className}`}
      onClick={toggleSearch}
      aria-label={t('globalSearch')}
    >
      <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      {buttonText}
      <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
};