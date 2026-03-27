"use client";

import {
    Settings,
    Users,
    Globe,
    ShieldCheck,
    Bell,
    Smartphone,
    CreditCard,
    Database,
    Key,
    ExternalLink,
    Save,
    Trash2,
    Moon,
    Sun,
    Palette,
    CheckCircle2,
    XCircle,
    ChevronRight,
    MoreVertical,
    Briefcase,
    Camera,
    User,
    GalleryHorizontal
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSystem } from "@/context/SystemContext";
import { useSession } from "next-auth/react";
import FormField from "@/components/ui/FormField";
import React, { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage();
    const { data: session, update } = useSession();
    
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        password: "",
        avatar: ""
    });
    
    // System settings state
    const { systemName, logoUrl, refresh: refreshSystem } = useSystem();
    const [systemData, setSystemData] = useState({ 
        systemName: "", 
        logoUrl: "",
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        companyEmail: "",
        companyTaxCode: "",
        companyBankInfo: "",
        companyCountry: "",
        companyState: "",
        companyCity: ""
    });
    const [savingSystem, setSavingSystem] = useState(false);
    
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setProfileData(prev => ({
                ...prev,
                name: (session.user as any).name || "",
                email: (session.user as any).email || ""
            }));
            // Fetch avatar from API (not from session token which doesn't carry avatar)
            fetch("/api/users/profile")
                .then(r => r.json())
                .then(data => {
                    if (data?.avatar) {
                        setProfileData(prev => ({ ...prev, avatar: data.avatar }));
                    }
                })
                .catch(() => {});
        }
    }, [session]);

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSystemData({
                    systemName: data.systemName || "",
                    logoUrl: data.logoUrl || "",
                    companyName: data.companyName || "",
                    companyAddress: data.companyAddress || "",
                    companyPhone: data.companyPhone || "",
                    companyEmail: data.companyEmail || "",
                    companyTaxCode: data.companyTaxCode || "",
                    companyBankInfo: data.companyBankInfo || "",
                    companyCountry: data.companyCountry || "",
                    companyState: data.companyState || "",
                    companyCity: data.companyCity || ""
                });
            }
        };
        fetchSettings();
    }, [systemName, logoUrl]);

    const handleProfileChange = (e: any) => {
        setProfileData({ ...profileData, [e.target.id]: e.target.value });
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                // Update the session via NextAuth's update function
                await update({
                    name: profileData.name
                });
                window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: profileData.avatar }));
                showToast("success", "Cập nhật hồ sơ thành công!");
                setProfileData(prev => ({ ...prev, password: "" }));
            } else {
                showToast("error", "Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error(error);
            showToast("error", "Lỗi hệ thống.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSystem = async () => {
        setSavingSystem(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(systemData)
            });
            if (res.ok) {
                await refreshSystem();
                showToast("success", "Cập nhật cấu hình hệ thống thành công!");
            } else {
                showToast("error", "Lỗi khi cập nhật cấu hình hệ thống. (Chỉ Admin mới có quyền đổi)");
            }
        } catch (error) {
            console.error(error);
            showToast("error", "Lỗi hệ thống.");
        } finally {
            setSavingSystem(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{t("common.settings")}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] flex items-center mt-1">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-sky-500" />
                        Cấu hình ưu tiên hệ thống và tài khoản
                    </p>
                </div>
                <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="h-12 px-8 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center space-x-2 w-full md:w-auto disabled:opacity-50"
                >
                    <Save className="w-5 h-5 shadow-inner" />
                    <span>{saving ? "Saving..." : t("common.save")}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-2">
                    {[
                        { label: "Cài đặt chung", icon: Settings, href: "/settings", active: true },
                        { label: "Quản lý nhân sự", icon: Users, href: "/settings/users" },
                        { label: "Phân quyền & Vai trò", icon: ShieldCheck, href: "/settings/roles" },
                        { label: "Nhật ký hệ thống", icon: Database, href: "/settings/logs" },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-4 p-5 rounded-[28px] transition-all group",
                                item.active
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl"
                                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                item.active ? "bg-brand-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700"
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                        </a>
                    ))}
                </div>

                {/* Content Column */}
                <div className="md:col-span-2 space-y-10 pb-20">
                    {/* Personal Profile Section */}
                    <div className="bg-white rounded-[40px] border border-slate-200 p-6 md:p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tighter">Hồ sơ cá nhân</h3>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Thông tin liên lạc và bảo mật</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                        {/* Avatar Upload Section */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-slate-100 border-4 border-white shadow-2xl flex items-center justify-center relative ring-1 ring-slate-200">
                                {profileData.avatar ? (
                                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-slate-300" />
                                )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Ảnh đại diện</p>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-700 transition-colors text-[10px] font-bold uppercase tracking-widest shadow">
                                    <Camera className="w-3.5 h-3.5" />
                                    {profileData.avatar ? "Thay ảnh" : "Tải ảnh lên"}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    showToast("error", "Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                                {profileData.avatar && (
                                    <button
                                        type="button"
                                        onClick={() => setProfileData(prev => ({ ...prev, avatar: "" }))}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Xóa ảnh
                                    </button>
                                )}
                            </div>
                            <p className="text-[8px] font-medium text-slate-400 text-center">Tối đa 2MB · JPG, PNG, GIF</p>
                        </div>

                        <div className="flex-1 space-y-6 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField 
                                    id="name" 
                                    label="Họ và Tên" 
                                    value={profileData.name} 
                                    onChange={handleProfileChange} 
                                />
                                <FormField 
                                    id="email" 
                                    label="Email (Không thể đổi)" 
                                    value={profileData.email} 
                                    onChange={handleProfileChange} 
                                    disabled
                                />
                            </div>
                            <FormField 
                                id="password" 
                                label="Mật khẩu mới (bỏ trống nếu không đổi)" 
                                type="password"
                                value={profileData.password} 
                                onChange={handleProfileChange} 
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                    {/* System Configuration Section */}
                    { (session?.user as any)?.role === "ADMIN" && (
                    <div className="bg-white rounded-[40px] border border-slate-200 p-6 md:p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                                    <Settings className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tighter">Cấu hình Hệ Thống</h3>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Logo & Tên ứng dụng (Chỉ Admin)</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveSystem}
                                disabled={savingSystem}
                                className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[9px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {savingSystem ? "Saving..." : "Lưu hệ thống"}
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            <div className="relative group/logo">
                                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-2xl flex items-center justify-center relative ring-1 ring-slate-200 p-2">
                                    {systemData.logoUrl ? (
                                        <img src={systemData.logoUrl} alt="Logo" className="w-full h-full object-contain transition-transform group-hover/logo:scale-110" />
                                    ) : (
                                        <GalleryHorizontal className="w-10 h-10 text-slate-300" />
                                    )}
                                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                        <Camera className="w-8 h-8 text-white mb-1" />
                                        <span className="text-[8px] text-white font-bold uppercase tracking-widest">Tải Logo</span>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        showToast("error", "Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setSystemData(prev => ({ ...prev, logoUrl: reader.result as string }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    {systemData.logoUrl && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSystemData(prev => ({ ...prev, logoUrl: "" }));
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/logo:opacity-100 hover:bg-red-600 transition-all z-10 shadow-lg"
                                            title="Xóa logo"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 text-center">Logo hiển thị</p>
                            </div>

                            <div className="flex-1 space-y-6 w-full pt-4">
                                <FormField 
                                    id="systemName" 
                                    label="Tên Phần Mềm CRM / Hệ Thống" 
                                    value={systemData.systemName} 
                                    onChange={(e) => setSystemData(prev => ({...prev, systemName: e.target.value}))} 
                                />
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Logo và tên này sẽ hiển thị ở Sidebar và các module khác thay cho "FADA EXPRESS". Thích hợp để "White-label" hệ thống.
                                </p>

                                <div className="border-t border-slate-100 pt-6 mt-6 space-y-6">
                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Thông tin Công ty (Mặc định Người gửi)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField 
                                            id="companyName" 
                                            label="Tên Công Ty" 
                                            value={systemData.companyName} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyName: e.target.value}))} 
                                        />
                                        <FormField 
                                            id="companyTaxCode" 
                                            label="Mã Số Thuế" 
                                            value={systemData.companyTaxCode} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyTaxCode: e.target.value}))} 
                                        />
                                    </div>
                                    <FormField 
                                        id="companyCountry" 
                                        label="Quốc gia" 
                                        value={systemData.companyCountry || ""} 
                                        onChange={(e) => setSystemData(prev => ({...prev, companyCountry: e.target.value, companyState: "", companyCity: ""}))} 
                                        options={[{label: "-- Chọn Quốc Gia --", value: ""}, ...Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))]}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField 
                                            id="companyState" 
                                            label="Tiểu bang / Tỉnh thành" 
                                            value={systemData.companyState || ""} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyState: e.target.value, companyCity: ""}))} 
                                            options={[{label: "-- Chọn Tỉnh thành --", value: ""}, ...(systemData.companyCountry ? State.getStatesOfCountry(systemData.companyCountry).map(s => ({ label: s.name, value: s.isoCode })) : [])]}
                                        />
                                        <FormField 
                                            id="companyCity" 
                                            label="Thành phố / Quận huyện" 
                                            value={systemData.companyCity || ""} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyCity: e.target.value}))} 
                                            options={[{label: "-- Chọn Thành phố --", value: ""}, ...(systemData.companyCountry && systemData.companyState ? City.getCitiesOfState(systemData.companyCountry, systemData.companyState).map(c => ({ label: c.name, value: c.name })) : [])]}
                                        />
                                    </div>
                                    <FormField 
                                        id="companyAddress" 
                                        label="Địa Chỉ Chi Tiết (Đường, số nhà...)" 
                                        value={systemData.companyAddress} 
                                        onChange={(e) => setSystemData(prev => ({...prev, companyAddress: e.target.value}))} 
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField 
                                            id="companyPhone" 
                                            label="Số Điện Thoại" 
                                            value={systemData.companyPhone} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyPhone: e.target.value}))} 
                                        />
                                        <FormField 
                                            id="companyEmail" 
                                            label="Email Công Ty" 
                                            value={systemData.companyEmail} 
                                            onChange={(e) => setSystemData(prev => ({...prev, companyEmail: e.target.value}))} 
                                        />
                                    </div>
                                    <FormField 
                                        id="companyBankInfo" 
                                        label="Thông Tin Tài Khoản Ngân Hàng" 
                                        value={systemData.companyBankInfo} 
                                        onChange={(e) => setSystemData(prev => ({...prev, companyBankInfo: e.target.value}))} 
                                        placeholder="STK - Ngân hàng - Chủ TK"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Language Selection */}
                    <div className="bg-white rounded-[40px] border border-slate-200 p-6 md:p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center border border-brand-100 group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tighter">Ngôn ngữ hệ thống</h3>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1 uppercase">Dịch toàn hệ thống</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <button
                                onClick={() => setLanguage("en")}
                                className={cn(
                                    "p-6 md:p-10 rounded-[32px] border-4 transition-all flex flex-col items-center space-y-4 group/lang",
                                    language === "en" ? "bg-slate-900 border-brand-500 text-white shadow-2xl" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100"
                                )}
                            >
                                <span className="text-lg font-bold tracking-tighter">English (EN)</span>
                                <p className="text-[11px] font-bold uppercase tracking-widest">English (Global)</p>
                                {language === "en" && <CheckCircle2 className="w-6 h-6 text-brand-400" />}
                            </button>
                            <button
                                onClick={() => setLanguage("vi")}
                                className={cn(
                                    "p-6 md:p-10 rounded-[32px] border-4 transition-all flex flex-col items-center space-y-4 group/lang",
                                    language === "vi" ? "bg-slate-900 border-brand-500 text-white shadow-2xl" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100"
                                )}
                            >
                                <span className="text-lg font-bold tracking-tighter">Tiếng Việt (VI)</span>
                                <p className="text-[11px] font-bold uppercase tracking-widest">Tiếng Việt (Mặc định)</p>
                                {language === "vi" && <CheckCircle2 className="w-6 h-6 text-brand-400" />}
                            </button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                                    <Sun className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tighter">Giao diện hệ thống</h3>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Tuỳ chỉnh hiển thị</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-2 bg-slate-50 rounded-[28px] shadow-inner">
                            {[
                                { mode: "light", icon: Sun },
                                { mode: "dark", icon: Moon },
                                { mode: "brand", icon: Palette },
                                { mode: "system", icon: Smartphone },
                            ].map((theme) => (
                                <button key={theme.mode} className={cn(
                                    "flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl transition-all font-bold text-[9px] uppercase tracking-[0.2em] relative overflow-hidden group/th",
                                    theme.mode === "light" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600"
                                )}>
                                    <theme.icon className="w-4 h-4" />
                                    <span>{theme.mode}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 rounded-[40px] border border-red-100 p-10 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-red-200 group-hover:scale-110 transition-transform">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-red-900 tracking-tighter">Vùng nguy hiểm</h3>
                                    <p className="text-[10px] font-bold uppercase text-red-400 tracking-widest mt-1">Cảnh báo, tác động hệ thống</p>
                                </div>
                            </div>
                        </div>
                        <button className="bg-white text-red-600 px-8 py-4 rounded-3xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-red-600 hover:text-white active:scale-95 shadow-lg shadow-red-500/10">
                            Xoá Cache hệ thống
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
