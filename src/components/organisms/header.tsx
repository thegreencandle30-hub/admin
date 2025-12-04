'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/atoms/button';
import { logout } from '@/services/auth-service';
import type { Admin } from '@/shared/types';

interface HeaderProps {
  admin: Admin | null;
  onMenuClick: () => void;
}

const Header = ({ admin, onMenuClick }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-xl border-b border-border px-4 sm:px-6 flex items-center justify-between transition-all duration-200 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-3xl text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-foreground">
          The Green Candle
        </h1>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm shadow-sm">
            {admin?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <span className="hidden sm:block max-w-[150px] truncate">{admin?.email || 'Admin'}</span>
          <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-3xl shadow-lg border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 border-border">
              <p className="text-sm font-medium text-popover-foreground truncate">{admin?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{admin?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full border-none justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
