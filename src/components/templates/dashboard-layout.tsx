'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header } from '@/components/organisms';
import { ToastProvider } from '@/components/molecules';
import { getCurrentAdmin, isAuthenticated } from '@/services/auth-service';
import type { Admin } from '@/shared/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.replace('/login');
        return;
      }

      const response = await getCurrentAdmin();
      if (response.success && response.data) {
        setAdmin(response.data.admin);
      } else {
        router.replace('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  const handleMenuClick = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header admin={admin} onMenuClick={handleMenuClick} />
        <main className="flex-1 p-4 sm:p-6 animate-fade-in">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
