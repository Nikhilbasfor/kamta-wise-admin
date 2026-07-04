"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import AdminGuard from "@/components/AdminGuard";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Receipt, 
  Users, 
  Mail, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
    { name: "Categories", href: "/dashboard/categories", icon: Layers },
    { name: "Orders", href: "/dashboard/orders", icon: Receipt },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Contact Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Newsletter", href: "/dashboard/newsletter", icon: FileText },
    { name: "Site Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "contact_messages"), 
        where("status", "==", "unread")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
      }, (err) => {
        console.error("Error subscribing to contact messages count:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar - left fixed */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full font-sans">
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/dashboard" className="text-sm font-bold tracking-[0.2em] text-slate-100 uppercase">
            KAMTA WISE ADMIN
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-medium tracking-wide uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-slate-800 text-slate-100 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.name}</span>
                </div>
                {item.name === "Contact Messages" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <div className="px-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
              Signed In As
            </span>
            <span className="text-xs text-slate-300 font-medium truncate block max-w-full">
              {user?.email || "Admin"}
            </span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:text-red-200 hover:bg-red-950/20 text-xs uppercase tracking-wider py-5"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area - right side scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-hidden font-sans">
        {/* Optional Header block */}
        <header className="h-16 flex items-center px-8 border-b border-slate-800/80 bg-slate-950">
          <span className="text-xs text-slate-500 uppercase tracking-[0.15em] font-medium">
            System Operational
          </span>
        </header>

        {/* Main scrollable body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
          {children}
        </main>
      </div>
    </div>
    </AdminGuard>
  );
}
