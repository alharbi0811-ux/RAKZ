import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, LayoutDashboard, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "الرئيسية", href: "/" },
    { name: "ألعابي", href: "/history" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDark
          ? `bg-[#0a0010]/90 backdrop-blur-md border-b border-white/5 ${isScrolled ? "shadow-[0_4px_24px_rgba(123,47,190,0.18)] py-2 md:py-2 lg:py-3" : "py-2.5 md:py-3 lg:py-5"}`
          : `bg-white/95 backdrop-blur-md ${isScrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-2 md:py-2 lg:py-3" : "py-2.5 md:py-3 lg:py-5"}`
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
            <Link href="/" className="flex-shrink-0 z-10">
              <img
                src="/logo-rakez-new.png"
                alt="ركز"
                className="h-16 lg:h-20 xl:h-24 w-auto hover:scale-105 transition-transform"
                style={{ filter: "drop-shadow(0 0 10px rgba(123, 47, 190, 0.5)) drop-shadow(0 0 22px rgba(123, 47, 190, 0.25))" }}
              />
            </Link>

            <nav className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-8 xl:gap-12">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => navigate(link.href)}
                  className="text-foreground hover:text-primary font-medium transition-colors relative group text-center text-sm sm:text-base md:text-lg lg:text-[22px] xl:text-[25px]"
                >
                  {link.name}
                  <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                isDark
                  ? "bg-white/10 hover:bg-white/18 text-yellow-300"
                  : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
              }`}
              title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  {isDark ? <Sun size={19} /> : <Moon size={19} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {user ? (
              <div className="flex items-center gap-3">
                {user.isAdmin && (
                  <Link href="/admin">
                    <a className={`flex items-center gap-1.5 text-[#7B2FBE] font-semibold text-sm px-3 py-2 rounded-full transition-colors ${isDark ? "bg-violet-500/10 hover:bg-violet-500/20" : "bg-violet-50 hover:bg-violet-100"}`}>
                      <LayoutDashboard size={15} />
                      <span className="text-[20px]">الإدارة</span>
                    </a>
                  </Link>
                )}
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountMenuOpen((o) => !o)}
                    className="flex items-center gap-2 text-foreground font-medium px-4 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  >
                    <User size={18} />
                    <span className="text-[20px]">{user.displayName || user.username}</span>
                  </button>
                  <AnimatePresence>
                    {accountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute left-0 mt-2 w-44 rounded-2xl shadow-xl overflow-hidden z-50 border ${
                          isDark ? "bg-[#120820] border-white/10" : "bg-white border-gray-100"
                        }`}
                      >
                        <button
                          onClick={() => { logout(); setAccountMenuOpen(false); }}
                          className={`flex items-center gap-2 w-full px-4 py-3 text-red-500 transition-colors text-sm ${isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
                        >
                          <LogOut size={16} />
                          تسجيل الخروج
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="text-foreground hover:text-primary flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full hover:bg-foreground/5 transition-colors"
              >
                <User size={20} />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="hidden flex items-center gap-2 z-10">
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.85 }}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                isDark ? "bg-white/10 text-yellow-300" : "bg-foreground/5 text-foreground/70"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  {isDark ? <Sun size={17} /> : <Moon size={17} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            <button
              className="text-foreground p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 glass-panel border-b border-border shadow-2xl md:hidden flex flex-col"
          >
            <div className="flex flex-col px-6 py-8 space-y-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => { navigate(link.href); setMobileMenuOpen(false); }}
                  className="text-foreground text-xl font-bold border-b border-border pb-4 text-right"
                >
                  {link.name}
                </button>
              ))}
              <div className="flex flex-col gap-4 pt-4">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-foreground/70 py-2 font-medium justify-center">
                      <User size={18} />
                      <span>{user.displayName || user.username}</span>
                    </div>
                    {user.isAdmin && (
                      <button
                        onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                        className="flex items-center justify-center gap-2 text-[#7B2FBE] py-2 font-medium"
                      >
                        <LayoutDashboard size={18} />
                        <span>لوحة الإدارة</span>
                      </button>
                    )}
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 text-red-500 py-2 font-medium"
                    >
                      <LogOut size={18} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 text-foreground/70 py-3 mt-2 font-medium"
                  >
                    <User size={20} />
                    <span>تسجيل الدخول / حساب جديد</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
