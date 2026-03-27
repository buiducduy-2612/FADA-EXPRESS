"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    Package,
    Plane,
    FileCheck,
    Settings,
    ShieldCheck,
    CreditCard,
    BarChart3,
    Calendar,
    LogOut,
    Plus,
    Moon,
    Sun,
    X,
    UserPlus,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";

const NAV_GROUPS = [
    {
        title: "common.group_operations",
        roles: ["ADMIN", "SALE", "CS", "ACCOUNTING", "DIRECTOR"],
        items: [
            { id: 'dashboard', label: "common.dashboard", icon: LayoutDashboard, href: "/", roles: ["ADMIN", "SALE", "CS", "ACCOUNTING", "DIRECTOR"] },
            { id: 'customers', label: "common.customers", icon: Users, href: "/customers", roles: ["ADMIN", "SALE", "CS", "ACCOUNTING", "DIRECTOR"] },
            { id: 'customer_approval', label: "common.customer_approval", icon: ShieldCheck, href: "/customers/approve", roles: ["ADMIN", "DIRECTOR"] },
            { id: 'bookings', label: "common.bookings", icon: Package, href: "/bookings", roles: ["ADMIN", "SALE", "CS", "ACCOUNTING", "DIRECTOR"] },
        ]
    },
    {
        title: "common.group_finance",
        roles: ["ADMIN", "ACCOUNTING", "DIRECTOR"],
        items: [
            { id: 'finance', label: "common.debt_management", icon: CreditCard, href: "/invoices", roles: ["ADMIN", "ACCOUNTING", "DIRECTOR", "SALE", "CS"] },
            { id: 'my_bill', label: "common.my_bill", icon: FileText, href: "/my-bill", roles: ["ADMIN", "ACCOUNTING", "DIRECTOR", "SALE", "CS"] },
        ]
    },
    {
        title: "common.group_management",
        roles: ["ADMIN", "DIRECTOR"],
        items: [
            { id: 'analytics', label: "common.analytics", icon: BarChart3, href: "/analytics", roles: ["ADMIN", "DIRECTOR", "ACCOUNTING", "SALE"] },
            { id: 'leads', label: "common.leads", icon: UserPlus, href: "/leads", roles: ["ADMIN", "DIRECTOR", "CS"] },
            { id: 'templates', label: "common.email_templates", icon: FileCheck, href: "/settings/email-templates", roles: ["ADMIN", "DIRECTOR"] },
            { id: 'settings', label: "common.settings", icon: Settings, href: "/settings", roles: ["ADMIN", "DIRECTOR"] },
        ]
    }
];

interface SidebarProps {
    onClose?: () => void;
}

function LogoImage({ url, fallback, className = "w-full h-full object-contain p-1" }: { url?: string | null, fallback: React.ReactNode, className?: string }) {
    const [error, setError] = useState(false);
    if (!url || error) return <>{fallback}</>;
    return (
        <img 
            src={url} 
            alt="Logo" 
            className={className}
            onError={() => setError(true)}
        />
    );
}

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { systemName, logoUrl } = useSystem();
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const userRole = (session?.user as any)?.role || "SALE";
    const isAdmin = userRole === "ADMIN" || userRole === "DIRECTOR";

    const [avatar, setAvatar] = useState<string | null>(null);

    const [counts, setCounts] = useState({
        pendingCustomers: 0,
        pendingBookings: 0
    });

    useEffect(() => {
        if (isAdmin) {
            fetchCounts();
        }

        // Fetch avatar independently of NextAuth token
        if (session) {
            fetch("/api/users/profile").then(r => r.json()).then(data => {
                if (data?.avatar) setAvatar(data.avatar);
            }).catch(err => console.error(err));
        }

        const handleUpdate = (e: any) => {
            setAvatar(e.detail || null);
        };
        window.addEventListener('avatarUpdated', handleUpdate);
        return () => window.removeEventListener('avatarUpdated', handleUpdate);
    }, [isAdmin, session]);

    const fetchCounts = async () => {
        try {
            const res = await fetch("/api/counts");
            if (res.ok) {
                const data = await res.json();
                setCounts({
                    pendingCustomers: data.pendingCustomers ?? 0,
                    pendingBookings: data.pendingBookings ?? 0,
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <aside className="w-64 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-2xl text-zinc-600 dark:text-zinc-400 flex flex-col h-full border-r border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shrink-0 relative transition-colors">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white lg:hidden z-50 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="px-5 pt-5 pb-4 mb-2">
                {logoUrl ? (
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <img src={logoUrl} alt={systemName} className="h-9 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-[14px] flex items-center justify-center shadow-sm">
                            <Plane className="w-6 h-6 text-white dark:text-zinc-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight leading-none uppercase">{systemName.split(' ')[0] || "FADA"}</h1>
                            <p className="text-[10px] text-zinc-500 font-bold italic uppercase tracking-widest mt-1">{systemName.split(' ').slice(1).join(' ') || "Express"}</p>
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
                {NAV_GROUPS.map((group, gIdx) => {
                    const groupItems = group.items.filter(item => item.roles.includes(userRole));
                    if (groupItems.length === 0) return null;
                    
                    return (
                        <div key={gIdx} className="space-y-2">
                            <h3 className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">
                                {t(group.title)}
                            </h3>
                            <div className="space-y-1">
                                {groupItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/customers") || (item.href === "/customers" && pathname === "/customers");
                                    const showIndicator = item.id === 'customer_approval' || (item.id === 'booking_approval' && isAdmin);
                                    const indicatorCount = item.id === 'customer_approval' ? counts.pendingCustomers : counts.pendingBookings;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-900/5 dark:ring-0"
                                                    : "text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-white"
                                            )}
                                        >
                                            <div className="relative">
                                                <item.icon className={cn(
                                                    "w-5 h-5 mr-3 transition-colors",
                                                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                                                )} />
                                            </div>
                                            <span className="flex-1 truncate">{t(item.label)}</span>
                                            {showIndicator && (
                                                <span className={cn(
                                                    "ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-lg",
                                                    indicatorCount > 0 
                                                        ? "bg-brand-500 text-white animate-pulse shadow-brand-500/20" 
                                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-none opacity-60"
                                                )}>
                                                    {indicatorCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-zinc-200/50 dark:border-zinc-800/50 bg-transparent">
                <div className="bg-white/50 dark:bg-zinc-800/30 rounded-2xl p-3 flex items-center space-x-3 border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-md">
                    { avatar ? (
                        <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0 overflow-hidden ring-2 ring-brand-500/20">
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-brand-500/20 uppercase">
                            {session?.user?.name?.[0] || "F"}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate uppercase tracking-tight">{session?.user?.name || "User"}</p>
                        <p className="text-[9px] font-bold text-zinc-500 truncate uppercase tracking-widest mt-0.5">{userRole}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all group"
                            title={theme === "light" ? "Dark Mode" : "Light Mode"}
                        >
                            {theme === "light" ? (
                                <Moon className="w-4 h-4 transition-colors" />
                            ) : (
                                <Sun className="w-4 h-4 transition-colors" />
                            )}
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                            className="p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all group"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
