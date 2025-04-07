import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  Bell, 
  LogOut,
  Search,
  User,
  HelpCircle,
  Settings,
  X,
  ChevronRight
} from "lucide-react";
import { initBrowserDetection, applyBrowserClasses } from "../utils/browser";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "../components/ui/dropdown-menu";
import { Logo } from "../components/ui/logo";
import SidebarNavigation from "../components/ui/SidebarNavigation";
import { NetworkStatus } from "../components/ui/network-status";
import { LanguageSelector } from "../components/ui/language-selector";
import { useLanguage, t } from "../utils/language";
import { fadeIn, pageTransition } from "../utils/animations";
import useMobile from "../hooks/use-mobile";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

interface MainLayoutProps {
  children: React.ReactNode;
}

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  closed: (isRtl: boolean) => ({
    x: isRtl ? '100%' : '-100%',
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  })
};

const overlayVariants = {
  open: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  closed: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export default function MainLayout({ children }: MainLayoutProps) {
  // State for sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useMobile();
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(64); // Default height
  
  // Determine if we're on a Setup sub-page for initial state
  const isSetupPage = location.startsWith('/customers') || 
                     location === '/machines' || 
                     location === '/products' ||
                     location.startsWith('/settings');
                     
  // State for section visibility - auto-open if on a Setup page
  const [setupSectionOpen, setSetupSectionOpen] = useState(isSetupPage);
  
  // Get user from auth context
  const [user, setUser] = useState<any>(null);
  
  // Get language context
  const { language, isRtl, toggleLanguage } = useLanguage();
  
  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Notification count
  const notificationCount = 2; // This would come from an API in a real app
  
  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Error fetching user:", err));
    }
  }, []);
  
  // Update sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
      
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // Get user initials for avatar
  const userInitials = user?.name 
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "U";
  
  // Keep Setup section open when navigating between Setup pages
  useEffect(() => {
    const isSetupPage = location.startsWith('/customers') || 
                       location === '/machines' || 
                       location === '/products' ||
                       location.startsWith('/settings');
    
    if (isSetupPage) {
      setSetupSectionOpen(true);
    }
  }, [location]);
  
  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);
  
  // Initialize browser detection for cross-browser compatibility
  useEffect(() => {
    initBrowserDetection();
    
    // Update browser classes on resize
    const handleResize = () => {
      applyBrowserClasses();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get page title based on current location
  const getPageTitle = () => {
    if (location === '/') return t('dashboard');
    if (location.startsWith('/orders')) return t('orders');
    if (location.startsWith('/production')) return t('production');
    if (location.startsWith('/customers')) return t('customers');
    if (location === '/machines') return t('machines');
    if (location === '/products') return t('products');
    if (location.startsWith('/settings')) return t('settings');
    return 'MPBF System';
  };

  return (
    <div className={`bg-gray-50 min-h-screen w-full ${isRtl ? 'rtl' : 'ltr'} font-['Libre_Baskerville',serif] responsive-container`}>
      {/* Network Status Component */}
      <NetworkStatus />
      
      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && !isMobile && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} z-50 h-screen w-64 lg:w-72 transform ${
          sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-teal-700 to-teal-900 text-white shadow-xl">
          {/* Logo section */}
          <div className="flex items-center justify-between h-16 px-5 bg-teal-900/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full p-1 shadow-md">
                <Logo size="small" />
              </div>
              <h1 className="text-xl font-semibold">MPBF System</h1>
            </div>
            {!isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-full hover:bg-teal-800 transition-colors"
              >
                <X className="h-5 w-5 text-teal-200" />
              </button>
            )}
          </div>
          
          {/* Search box */}
          <div className="px-4 py-3">
            <div className="relative rounded-lg bg-teal-700/40 text-teal-100">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-teal-300" />
              </div>
              <input
                type="text"
                placeholder={t('search')}
                className="block w-full bg-transparent border-0 py-2 pl-10 pr-3 text-sm placeholder-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-500 rounded-lg"
              />
            </div>
          </div>
          
          {/* User profile */}
          <div className="p-4 border-b border-teal-700/50 mt-1">
            <div className="flex items-center">
              <Avatar className={`h-10 w-10 ring-2 ring-white/20 ${isRtl ? 'ml-3' : 'mr-3'}`}>
                <AvatarFallback className="bg-teal-600 text-white">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {isRtl && user?.arabic_name ? user.arabic_name : (user?.name || t('user'))}
                </p>
                <p className="text-xs text-teal-200">
                  {user?.role ? (
                    user.role === 'salesperson' ? t('salespersonRole') :
                    user.role === 'admin' ? t('admin') :
                    user.role === 'manager' ? t('manager') :
                    user.role === 'operator' ? t('operator') : 
                    user.role
                  ) : t('role')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-teal-400" />
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-3">
            <SidebarNavigation 
              location={location} 
              isRtl={isRtl} 
              setupSectionOpen={setupSectionOpen}
              setSetupSectionOpen={setSetupSectionOpen}
              mobile={!isMobile}
              onLinkClick={() => !isMobile && setSidebarOpen(false)}
            />
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-teal-700/50">
            <div className="flex items-center justify-between text-teal-300 text-sm">
              <span>© {new Date().getFullYear()} MPBF</span>
              <div className="flex space-x-3">
                <HelpCircle className="h-5 w-5 cursor-pointer hover:text-white transition-colors" />
                <Settings className="h-5 w-5 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div 
        className={`min-h-screen w-full flex flex-col ${
          sidebarOpen ? (isRtl ? 'lg:mr-72' : 'lg:ml-72') : ''
        } transition-all duration-300 responsive-container`}
      >
        {/* Header */}
        <header 
          ref={headerRef}
          className="bg-white shadow-sm z-10 border-b border-gray-200 sticky top-0"
        >
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-teal-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-200"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <h1 className="font-semibold text-gray-800 text-lg hidden sm:block">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search toggle for mobile */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.div
                      initial={{ opacity: 0, width: 40 }}
                      animate={{ opacity: 1, width: 180 }}
                      exit={{ opacity: 0, width: 40 }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      <Input 
                        type="text" 
                        placeholder={t('search')} 
                        className="h-9 w-full pr-8" 
                        autoFocus
                        onBlur={() => setSearchOpen(false)}
                      />
                      <button 
                        onClick={() => setSearchOpen(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => setSearchOpen(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </motion.button>
              </div>
              
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center"
                  >
                    <span className="sr-only">Open user menu</span>
                    <Avatar className="h-8 w-8 ring-2 ring-teal-100">
                      <AvatarFallback className="bg-teal-600 text-white">{userInitials}</AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1">
                  <div className="px-4 py-3 flex flex-col items-center space-y-2 border-b border-gray-100">
                    <Avatar className="h-16 w-16 ring-2 ring-teal-100">
                      <AvatarFallback className="bg-teal-600 text-white text-xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-900">{user?.name || t('user')}</p>
                      <p className="text-sm text-gray-500">{user?.email || user?.username || ''}</p>
                      <Badge variant="secondary" className="mt-1">
                        {user?.role ? (
                          user.role === 'salesperson' ? t('salespersonRole') :
                          user.role === 'admin' ? t('admin') :
                          user.role === 'manager' ? t('manager') :
                          user.role === 'operator' ? t('operator') : 
                          user.role
                        ) : t('role')}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenuItem className="flex items-center py-2">
                    <User className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 text-gray-500`} />
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex items-center py-2">
                    <Settings className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 text-gray-500`} />
                    <span>{t('settings')}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => {
                      localStorage.removeItem("auth_token");
                      window.location.href = "/";
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 py-2"
                  >
                    <LogOut className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    <span>{t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page content with animation */}
        <motion.main 
          className={`flex-1 bg-gray-50 p-4 sm:p-6 shadow-inner ${isRtl ? 'main-content rtl-main rtl-content-wrapper' : ''} responsive-container`}
          {...pageTransition}
          key={location}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className={`w-full ${
                isRtl 
                  ? 'rtl-content-wrapper' 
                  : 'max-w-7xl mx-auto'
              } responsive-container`}
              style={{ 
                width: '100%', 
                maxWidth: isRtl ? '100%' : '7xl',
                direction: isRtl ? 'rtl' : 'ltr'
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
}