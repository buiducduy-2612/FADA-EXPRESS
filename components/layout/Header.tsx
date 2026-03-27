"use client";

import {
    Bell,
    Search,
    Plus,
    Moon,
    Sun,
    ExternalLink,
    Menu,
    Plane,
    Users,
    PlusCircle,
    Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import BookingForm from "@/components/forms/BookingForm";

interface HeaderProps {
    onMenuClick?: () => void;
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

export default function Header({ onMenuClick }: HeaderProps) {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const { systemName } = useSystem();
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ customers: any[], bookings: any[] }>({ customers: [], bookings: [] });
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Quick create state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useOnClickOutside(searchRef, () => setSearchOpen(false));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setSearchResults({ customers: [], bookings: [] });
                setSearchOpen(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (isCreateModalOpen) {
            fetchCustomers();
        }
    }, [isCreateModalOpen]);

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            if (res.ok) setCustomers(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleQuickCreate = async (formData: any) => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                showToast("success", language === 'vi' ? "Tạo đơn hàng thành công!" : "Order created successfully!");
                // Optionally refresh or redirect
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast("error", language === 'vi' ? "Không thể tạo đơn hàng" : "Failed to create order");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Error connection");
        } finally {
            setSubmitting(false);
        }
    };

    const performSearch = async () => {
        setSearchLoading(true);
        try {
            const [custRes, bookRes] = await Promise.all([
                fetch(`/api/customers?search=${searchQuery}`),
                fetch(`/api/bookings?search=${searchQuery}`)
            ]);
            
            if (custRes.ok && bookRes.ok) {
                const customers = await custRes.json();
                const bookings = await bookRes.json();
                
                const filteredCust = (customers || []).filter((c: any) => 
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5);
                
                const filteredBook = (bookings || []).filter((b: any) => 
                    b.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.hbl?.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5);

                setSearchResults({ customers: filteredCust, bookings: filteredBook });
                setSearchOpen(filteredCust.length > 0 || filteredBook.length > 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };
    const notificationsRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(notificationsRef, () => setNotificationsOpen(false));
    const { theme, toggleTheme } = useTheme();

    const user = session?.user as any;
    const isAdmin = user?.role === "ADMIN" || user?.role === "DIRECTOR";

    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (isAdmin) {
            fetchNotifications();
        }
    }, [isAdmin]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/counts");
            if (!res.ok) return;
            const data = await res.json();

            const newNotifications = [
                ...(data.pendingCustomerList || []).map((c: any) => ({
                    id: `cust-${c.id}`,
                    type: "customer",
                    title: language === 'vi' ? `Khách hàng mới: ${c.name}` : `New Customer: ${c.name}`,
                    description: language === 'vi' ? "Đang chờ duyệt" : "Pending approval",
                    time: c.createdAt
                })),
                ...(data.pendingBookingList || []).map((b: any) => ({
                    id: `book-${b.id}`,
                    type: "booking",
                    title: language === 'vi' ? `Đơn hàng mới: ${b.reference}` : `New Order: ${b.reference}`,
                    description: language === 'vi' ? `Từ ${b.origin} đến ${b.destination}` : `From ${b.origin} to ${b.destination}`,
                    time: b.createdAt
                }))
            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            setNotifications(newNotifications);
            setPendingCount(newNotifications.length);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <header className="sticky top-0 z-30 w-full bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-2xl shrink-0 transition-colors">
            <div className="h-16 flex items-center justify-between px-3 md:px-6 lg:px-8">
                <div className="flex flex-1 items-center space-x-2 md:space-x-4 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="lg:hidden flex items-center space-x-2">
                        <Link href="/" className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-[10px] flex items-center justify-center overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                            <LogoImage url={useSystem().logoUrl} fallback={<Plane className="w-4 h-4 text-zinc-900 dark:text-white" />} />
                        </Link>
                    </div>

                   <div className="hidden lg:flex flex-1 max-w-md relative" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'vi' ? `Tìm kiếm trong ${systemName}...` : `Search in ${systemName}...`}
                        className="h-11 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 pl-11 pr-4 text-xs font-medium text-zinc-900 dark:text-zinc-100 border-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-zinc-400"
                    />
                    
                    {searchOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 max-h-[480px] overflow-y-auto">
                                {searchResults.customers.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Khách hàng</p>
                                        {searchResults.customers.map(cust => (
                                            <Link 
                                                key={cust.id} 
                                                href={`/customers/${cust.id}`}
                                                onClick={() => setSearchOpen(false)}
                                                className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{cust.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                
                                {searchResults.bookings.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Vận đơn / Booking</p>
                                        {searchResults.bookings.map(book => (
                                            <Link 
                                                key={book.id} 
                                                href={`/bookings/${book.id}`}
                                                onClick={() => setSearchOpen(false)}
                                                className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                                                    <Plane className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase block">{book.reference || 'N/A'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{book.origin} → {book.destination}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <button
                        onClick={() => router.push('/bookings/create')}
                        className="flex items-center justify-center bg-brand-500 text-white p-2.5 md:px-4 md:py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95 shrink-0"
                    >
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">{language === 'vi' ? "Tạo đơn" : "Create Order"}</span>
                    </button>

                    <button
                        onClick={() => { setMobileSearchOpen(v => !v); setSearchQuery(""); setSearchResults({ customers: [], bookings: [] }); }}
                        className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-700 pr-1 md:pr-4">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg mr-1">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage("vi")}
                                className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold rounded-md transition-all ${language === 'vi' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                VI
                            </button>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="hidden sm:flex p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
                            >
                                <Bell className="w-5 h-5" />
                                {pendingCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Thông báo phê duyệt</h4>
                                        <span className="text-[10px] font-bold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-lg">{pendingCount} MỚI</span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Không có yêu cầu phê duyệt mới</div>
                                        ) : notifications.map((notif) => (
                                            <Link 
                                                key={notif.id} 
                                                href={notif.type === "customer" ? "/customers" : "/bookings"}
                                                onClick={() => setNotificationsOpen(false)}
                                                className="block p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group"
                                            >
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        notif.type === "customer" ? "bg-amber-500/10" : "bg-brand-500/10",
                                                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                                    )}>
                                                        {notif.type === "customer" ? <Users className="w-5 h-5 text-amber-500" /> : <Plane className="w-5 h-5 text-brand-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1">{notif.title}</p>
                                                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-2">{notif.description}</p>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(notif.time)}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <button className="w-full py-4 text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors bg-slate-50 dark:bg-slate-800/50">
                                        Đóng thông báo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile search bar */}
            {mobileSearchOpen && (
                <div className="lg:hidden px-3 pb-3 relative" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={language === 'vi' ? `Tìm kiếm trong ${systemName}...` : `Search in ${systemName}...`}
                            className="h-10 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 pl-9 pr-4 text-xs font-medium text-zinc-900 dark:text-zinc-100 border-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-zinc-400"
                        />
                    </div>
                    {searchOpen && (
                        <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden z-50">
                            <div className="p-3 max-h-[60vh] overflow-y-auto">
                                {searchResults.customers.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Khách hàng</p>
                                        {searchResults.customers.map(cust => (
                                            <Link
                                                key={cust.id}
                                                href={`/customers/${cust.id}`}
                                                onClick={() => { setMobileSearchOpen(false); setSearchOpen(false); }}
                                                className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                                    <Users className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{cust.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {searchResults.bookings.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Vận đơn / Booking</p>
                                        {searchResults.bookings.map(book => (
                                            <Link
                                                key={book.id}
                                                href={`/bookings/${book.id}`}
                                                onClick={() => { setMobileSearchOpen(false); setSearchOpen(false); }}
                                                className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                                                    <Plane className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase block">{book.reference || 'N/A'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{book.origin} → {book.destination}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {searchResults.customers.length === 0 && searchResults.bookings.length === 0 && !searchLoading && searchQuery.trim() && (
                                    <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy kết quả</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={language === 'vi' ? "Tạo đơn hàng nhanh" : "Quick Create Order"}
                maxWidth="max-w-4xl"
            >
                <BookingForm 
                    customers={customers} 
                    onSubmit={handleQuickCreate} 
                    onCancel={() => setIsCreateModalOpen(false)} 
                    submitting={submitting} 
                />
            </Modal>
        </header>
    );
}
