import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  Bell, 
  LogOut,
  Search,
  User,
  Settings,
  X,
  ChevronDown,
  Home,
  Layers,
  BarChart,
  Users,
  PackageOpen,
  Settings2
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
import { NetworkStatus } from "../components/ui/network-status";
import { LanguageSelector } from "../components/ui/language-selector";
import { useLanguage, t } from "../utils/language";
import useMobile from "../hooks/use-mobile";
import { Input } from "../components/ui/input";
import { SearchButton } from "../components/ui/search";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // State for sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useMobile();
  const headerRef = useRef<HTMLElement>(null);
  
  // Get user from auth context
  const [user, setUser] = useState<any>(null);
  
  // Get language context
  const { language, isRtl, toggleLanguage } = useLanguage();
  
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
    <div className={`flex min-h-screen ${isRtl ? 'rtl' : 'ltr'} styled-scrollbar bg-background`}>
      {/* Network Status Component */}
      <NetworkStatus />
      
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Navigation */}
      <motion.aside
        className="fixed lg:sticky top-0 z-40 h-screen w-[280px] border-r border-border bg-card"
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : isRtl ? '100%' : '-100%',
          transition: { ease: 'easeInOut' }
        }}
        style={{ 
          left: isRtl ? 'auto' : 0,
          right: isRtl ? 0 : 'auto',
        }}
        transition={{ duration: 0.3 }}
        data-state={sidebarOpen ? "open" : "closed"}
      >
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex h-16 items-center border-b border-border px-4">
            <div className="flex flex-1 items-center gap-2">
              <Logo size="small" className="h-6 w-6" />
              <span className="text-lg font-semibold tracking-tight">MPBF System</span>
            </div>
            
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="size-5" />
                <span className="sr-only">Close sidebar</span>
              </button>
            )}
          </div>
          
          {/* User section */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">
                    {isRtl && user?.arabic_name ? user.arabic_name : (user?.name || t('user'))}
                  </span>
                </div>
                <span className="flex text-xs text-muted-foreground truncate">
                  {user?.role ? (
                    user.role === 'salesperson' ? t('salespersonRole') :
                    user.role === 'admin' ? t('admin') :
                    user.role === 'manager' ? t('manager') :
                    user.role === 'operator' ? t('operator') : 
                    user.role
                  ) : t('role')}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <ChevronDown className="size-4" />
                    <span className="sr-only">User menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} sideOffset={8} className="w-56">
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <User className="size-4" />
                      <span>{t('profile')}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Settings className="size-4" />
                      <span>{t('settings')}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => {
                      localStorage.removeItem("auth_token");
                      window.location.href = "/login";
                    }}
                  >
                    <LogOut className="size-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-2">
              <a 
                href="/"
                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  location === "/" 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Home className="size-4" />
                <span>{t('dashboard')}</span>
              </a>
              
              {/* Production Section with Nested Menu */}
              <div className="mt-2">
                <a 
                  href="/production"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    location.startsWith("/production") 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Layers className="size-4" />
                  <span>{t('production')}</span>
                </a>
                
                {/* Production Sub-items */}
                {location.startsWith("/production") && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
                    <a 
                      href="/production/joborders"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/production/joborders" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('jobOrders')}</span>
                    </a>
                    <a 
                      href="/production/rolls"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/production/rolls" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('rolls')}</span>
                    </a>
                    <a 
                      href="/production/mixing"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/production/mixing" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('mixing')}</span>
                    </a>
                    <a 
                      href="/production/workflow"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/production/workflow" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('workflow')}</span>
                    </a>
                    <a 
                      href="/production/waste-monitoring"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/production/waste-monitoring" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('wasteMonitoring')}</span>
                    </a>
                  </div>
                )}
              </div>
              
              <a 
                href="/orders"
                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  location.startsWith("/orders") 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <BarChart className="size-4" />
                <span>{t('orders')}</span>
              </a>
              <a 
                href="/customers"
                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  location.startsWith("/customers") 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Users className="size-4" />
                <span>{t('customers')}</span>
              </a>
              <a 
                href="/products"
                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  location.startsWith("/products") 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <PackageOpen className="size-4" />
                <span>{t('products')}</span>
              </a>
              
              {/* Settings Section - Placed at the End */}
              <div className="mt-2">
                <a 
                  href="/settings"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    location.startsWith("/settings") 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Settings2 className="size-4" />
                  <span>{t('settings')}</span>
                </a>
                
                {/* Settings Sub-items */}
                {location.startsWith("/settings") && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
                    <a 
                      href="/settings/users"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/settings/users" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('users')}</span>
                    </a>
                    <a 
                      href="/settings/sms"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location === "/settings/sms" 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('smsNotifications')}</span>
                    </a>
                    <a 
                      href="/machines"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${
                        location.startsWith("/machines") 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground hover:text-accent-foreground"
                      }`}
                    >
                      <span>{t('machines')}</span>
                    </a>
                  </div>
                )}
              </div>
            </nav>
          </div>
          
          {/* Footer */}
          <div className="mt-auto border-t border-border p-4">
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} MPBF
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </motion.aside>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header ref={headerRef} className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            type="button"
            className="lg:hidden rounded-md border border-input p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle menu</span>
          </button>
          
          <div className="w-full flex items-center justify-between">
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            
            <div className="flex items-center gap-2">
              <SearchButton responsive className="mr-2" />
              
              <div className="relative">
                <button className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                  <Bell className="size-5" />
                  <span className="sr-only">Notifications</span>
                </button>
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex size-2 rounded-full bg-destructive"></span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 space-y-4 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}