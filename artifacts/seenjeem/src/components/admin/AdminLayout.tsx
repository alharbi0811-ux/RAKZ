import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FolderOpen, HelpCircle, Users,
  LogOut, Menu, X, ChevronLeft, QrCode, Globe, Palette, Settings2, BookOpen, MessageSquare
} from "lucide-react";

interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={16} />, label: "لوحة التحكم", href: "/admin", exact: true },
  { icon: <FolderOpen size={16} />, label: "الفئات", href: "/admin/categories" },
  { icon: <HelpCircle size={16} />, label: "الأسئلة", href: "/admin/questions" },
  { icon: <Users size={16} />, label: "المستخدمون", href: "/admin/users" },
  { icon: <QrCode size={16} />, label: "قوالب QR", href: "/admin/qr-templates" },
  { icon: <Globe size={16} />, label: "الصفحات الخارجية", href: "/admin/external-pages" },
  { icon: <Palette size={16} />, label: "تصاميم الفئات", href: "/admin/category-layouts" },
  { icon: <Settings2 size={16} />, label: "إعدادات الموقع", href: "/admin/site-settings" },
  { icon: <BookOpen size={16} />, label: "وضع الدراسة", href: "/admin/study-mode" },
  { icon: <MessageSquare size={16} />, label: "صندوق الشكاوى", href: "/admin/feedback" },
];

const GRAD = "linear-gradient(135deg, #6A00F4, #7B3FF2, #8E63E6, #A07CE0, #B89AE6)";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? location === item.href : location.startsWith(item.href);

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#f5f3ff", color: "#1a1a2e" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-60 z-30 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} lg:sticky lg:top-0 lg:h-screen`}
        style={{
          background: "#ffffff",
          borderLeft: "1px solid rgba(123,63,242,0.15)",
          boxShadow: "-4px 0 24px rgba(106,0,244,0.06)",
        }}
      >
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(123,63,242,0.1)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ background: GRAD, boxShadow: "0 4px 12px rgba(106,0,244,0.35)" }}
            >
              ر
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#1a1a2e" }}>ركّز</p>
              <p className="text-[10px] font-medium" style={{ color: "#8E63E6" }}>لوحة الإدارة</p>
            </div>
          </div>
          <button className="lg:hidden transition-colors" style={{ color: "#aaa" }} onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link key={item.href + item.label} href={item.href}>
                
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative"
                  style={
                    active
                      ? {
                          background: GRAD,
                          color: "#ffffff",
                          boxShadow: "0 4px 14px rgba(106,0,244,0.3)",
                        }
                      : {
                          color: "#6b7280",
                        }
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            );
          })}

          <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(123,63,242,0.1)" }}>
            <Link href="/">
              
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-purple-50"
                style={{ color: "#9ca3af" }}
              >
                <ChevronLeft size={16} />
                العودة للموقع
              </a>
            </Link>
          </div>
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(123,63,242,0.1)" }}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ background: "#f5f3ff", border: "1px solid rgba(123,63,242,0.15)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 text-white"
              style={{ background: GRAD }}
            >
              {user?.username?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#1a1a2e" }}>{user?.username}</p>
              <p className="text-[10px] font-medium" style={{ color: "#8E63E6" }}>
                {user?.role?.toUpperCase()}
              </p>
            </div>
            <button
              onClick={logout}
              className="transition-colors hover:text-red-500"
              style={{ color: "#d1d5db" }}
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:mr-60">
        <header
          className="sticky top-0 z-10 px-6 py-3.5 flex items-center justify-between"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(123,63,242,0.12)",
            boxShadow: "0 1px 8px rgba(106,0,244,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden transition-colors"
              style={{ color: "#9ca3af" }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>متصل</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium hidden sm:block" style={{ color: "#c4b5fd" }}>
              {new Date().toLocaleDateString("ar-KW", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
