'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Headphones } from 'lucide-react';
import SignInModal from './auth/SignInModal';
import SignUpModal from './auth/SignUpModal';
import { useAuth } from '@/lib/AuthContext';
import UserDropdown from './UserDropdown';

const Header = () => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="bg-[#004AAA] py-4 px-6 fixed w-full top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-100 transition-colors">
          <Headphones size={28} />
          AlexListens
        </Link>
        <nav>
          <ul className="flex space-x-8 items-center">
            <li><Link href="#" className="text-blue-100 hover:text-white transition-colors">Home</Link></li>
            <li><Link href="#" className="text-blue-100 hover:text-white transition-colors">Features</Link></li>
            <li><Link href="#" className="text-blue-100 hover:text-white transition-colors">About</Link></li>
            <li><Link href="#" className="text-blue-100 hover:text-white transition-colors">Contact</Link></li>
            {!loading && (
              <>
                {user ? (
                  <li>
                    <UserDropdown />
                  </li>
                ) : (
                  <li>
                    <button
                      onClick={() => setIsSignInOpen(true)}
                      className="bg-white text-[#004AAA] px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Sign In
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>
      </div>

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignUpClick={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
      />

      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
      />
    </header>
  );
};

export default Header;