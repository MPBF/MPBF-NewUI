import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useSearch, SearchResult } from '../../../utils/search-context';
import { Dialog, DialogContent } from '../dialog';
import { Input } from '../input';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { useLanguage } from '../../../utils/language';
import {
  Search,
  X,
  Briefcase,
  Package,
  ShoppingCart,
  User,
  Settings,
  Tag,
  Layers,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import { Badge } from '../badge';

// Custom translation function
const useLocalTranslation = () => {
  const { language } = useLanguage();
  
  const translations = {
    english: {
      customers: 'Customers',
      products: 'Products',
      orders: 'Orders',
      jobOrders: 'Job Orders',
      users: 'Users',
      machines: 'Machines',
      rolls: 'Rolls',
      globalSearch: 'Global Search',
      searchAllModules: 'Search across all modules...',
      startTypingToSearch: 'Start typing to search across all modules',
      noResultsFound: 'No results found',
      noResultsForQuery: 'No results found for',
      searching: 'Searching...',
      searchingAllModules: 'Searching across all modules',
      clearSearch: 'Clear search',
      resultsFound: (count: number) => `${count} results found`,
      pressEscToClose: 'Press ESC to close',
      tip: 'Tip',
      toSearch: 'to search'
    },
    arabic: {
      customers: 'العملاء',
      products: 'المنتجات',
      orders: 'الطلبات',
      jobOrders: 'أوامر العمل',
      users: 'المستخدمين',
      machines: 'الآلات',
      rolls: 'اللفات',
      globalSearch: 'بحث شامل',
      searchAllModules: 'بحث في جميع الوحدات...',
      startTypingToSearch: 'ابدأ بالكتابة للبحث في جميع الوحدات',
      noResultsFound: 'لم يتم العثور على نتائج',
      noResultsForQuery: 'لم يتم العثور على نتائج لـ',
      searching: 'جاري البحث...',
      searchingAllModules: 'البحث في جميع الوحدات',
      clearSearch: 'مسح البحث',
      resultsFound: (count: number) => `تم العثور على ${count} نتيجة`,
      pressEscToClose: 'اضغط ESC للإغلاق',
      tip: 'نصيحة',
      toSearch: 'للبحث'
    }
  };
  
  // Translation function
  const t = (key: keyof typeof translations.english, options?: any): string => {
    const lang = language === 'english' ? 'english' : 'arabic';
    const translation = translations[lang][key];
    
    if (typeof translation === 'function' && options && typeof options === 'number') {
      return translation(options);
    }
    
    return typeof translation === 'string' ? translation : key;
  };
  
  return { t };
};

// Component to render each search result
const SearchResultItem = ({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) => {
  const { t } = useLocalTranslation();
  
  // Get the appropriate icon based on the module
  const icon = useMemo(() => {
    switch (result.module) {
      case 'customers':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'products':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'orders':
        return <ShoppingCart className="h-4 w-4 text-purple-500" />;
      case 'jobOrders':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'users':
        return <User className="h-4 w-4 text-red-500" />;
      case 'machines':
        return <Settings className="h-4 w-4 text-indigo-500" />;
      case 'rolls':
        return <Layers className="h-4 w-4 text-teal-500" />;
      default:
        return <Tag className="h-4 w-4 text-gray-500" />;
    }
  }, [result.module]);

  // Get the module translation
  const moduleText = useMemo(() => {
    if (result.module === 'customers') return t('customers');
    if (result.module === 'products') return t('products');
    if (result.module === 'orders') return t('orders');
    if (result.module === 'jobOrders') return t('jobOrders');
    if (result.module === 'users') return t('users');
    if (result.module === 'machines') return t('machines');
    if (result.module === 'rolls') return t('rolls');
    return result.module;
  }, [result.module, t]);

  return (
    <div
      className="flex cursor-pointer flex-col space-y-1 rounded-md p-3 hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium">{result.title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {moduleText}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{result.description}</p>
      {result.date && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{result.date}</span>
        </div>
      )}
    </div>
  );
};

// No results component
const NoResults = ({ query }: { query: string }) => {
  const { t } = useLocalTranslation();
  return (
    <div className="flex h-48 flex-col items-center justify-center space-y-2 p-4 text-center">
      <Search className="h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="font-semibold">{t('noResultsFound')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('noResultsForQuery')} <span className="font-semibold">{query}</span>
      </p>
    </div>
  );
};

// Empty state component
const EmptyState = () => {
  const { t } = useLocalTranslation();
  return (
    <div className="flex h-48 flex-col items-center justify-center space-y-2 p-4 text-center">
      <Search className="h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="font-semibold">{t('globalSearch')}</h3>
      <p className="text-sm text-muted-foreground">{t('startTypingToSearch')}</p>
    </div>
  );
};

// Loading state component
const LoadingState = () => {
  const { t } = useLocalTranslation();
  return (
    <div className="flex h-48 flex-col items-center justify-center space-y-2 p-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h3 className="font-semibold">{t('searching')}</h3>
      <p className="text-sm text-muted-foreground">{t('searchingAllModules')}</p>
    </div>
  );
};

// Main search dialog component
export const SearchDialog = () => {
  const { isOpen, setIsOpen, query, setQuery, results, searching, clearSearch } = useSearch();
  const [, setLocation] = useLocation();
  const { isRtl } = useLanguage();
  const { t } = useLocalTranslation();
  const [inputFocused, setInputFocused] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      timer = setTimeout(() => {
        const input = document.getElementById('global-search-input');
        if (input) {
          input.focus();
          // Only set focused state if it's not already focused to avoid loops
          if (!inputFocused) {
            setInputFocused(true);
          }
        }
      }, 100);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, inputFocused]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        clearSearch();
        setInputFocused(false);
      }, 0);
    }
  }, [isOpen, clearSearch]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setLocation(result.url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 sm:rounded-xl">
        <div className="flex items-center border-b p-4">
          <Search className={`h-5 w-5 text-muted-foreground ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <Input
            id="global-search-input"
            className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            placeholder={t('searchAllModules')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="h-8 w-8"
              aria-label={t('clearSearch')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="max-h-[60vh]">
          {!query && !searching && <EmptyState />}
          {searching && <LoadingState />}
          {query && !searching && results.length === 0 && <NoResults query={query} />}
          {!searching && results.length > 0 && (
            <ScrollArea className="max-h-[60vh]">
              <div className="p-2">
                {results.map((result) => (
                  <SearchResultItem
                    key={`${result.module}-${result.id}`}
                    result={result}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
          <div>
            {results.length > 0 && !searching
              ? t('resultsFound', results.length)
              : t('pressEscToClose')}
          </div>
          <div className="flex items-center gap-1">
            <span>{t('tip')}:</span>
            <kbd className="rounded bg-muted px-1 text-[10px]">Ctrl</kbd>
            <span>+</span>
            <kbd className="rounded bg-muted px-1 text-[10px]">K</kbd>
            <span>{t('toSearch')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};