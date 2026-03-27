"use client";

import { useState, useEffect, useRef } from "react";
import { Plane, Package, Shield, Clock, Globe, ChevronDown, MapPin, Phone, Mail, CheckCircle, ArrowRight, Star, Truck, BarChart3, Users, Menu, X, Send, Loader2, Search } from "lucide-react";
import Link from "next/link";

function useInView(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, { threshold: 0.15, ...options });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return { ref, inView };
}

const SERVICES = [
    {
        icon: Plane,
        title: "Vận chuyển hàng không quốc tế",
        desc: "Kết nối hơn 150 sân bay trên toàn thế giới. Đảm bảo hàng hóa của bạn đến đúng hạn, an toàn tuyệt đối.",
        color: "from-orange-500 to-amber-400",
        bg: "bg-orange-50",
    },
    {
        icon: Clock,
        title: "Dịch vụ Express 24/48h",
        desc: "Giao hàng khẩn cấp trong vòng 24–48 giờ đến các đầu mối quốc tế trọng yếu trên thế giới.",
        color: "from-orange-500 to-amber-400",
        bg: "bg-orange-50",
    },
    {
        icon: Truck,
        title: "Door-to-Door toàn cầu",
        desc: "Dịch vụ trọn gói từ kho đến tay người nhận. Chúng tôi xử lý toàn bộ thủ tục, bạn chỉ cần chờ nhận hàng.",
        color: "from-green-500 to-emerald-400",
        bg: "bg-green-50",
    },
    {
        icon: Shield,
        title: "Thông quan hàng hóa",
        desc: "Đội ngũ chuyên gia thông quan nhiều kinh nghiệm, xử lý nhanh chóng các thủ tục hải quan phức tạp.",
        color: "from-purple-500 to-violet-400",
        bg: "bg-purple-50",
    },
    {
        icon: Package,
        title: "Hàng đặc biệt & nguy hiểm",
        desc: "Có chứng chỉ IATA, xử lý chuyên biệt hàng nguy hiểm, hàng lạnh, hàng giá trị cao theo tiêu chuẩn quốc tế.",
        color: "from-red-500 to-rose-400",
        bg: "bg-red-50",
    },
    {
        icon: BarChart3,
        title: "Theo dõi thời gian thực",
        desc: "Hệ thống tracking thông minh, cập nhật vị trí hàng hóa theo thời gian thực 24/7 trực tiếp trên web.",
        color: "from-orange-400 to-amber-400",
        bg: "bg-sky-50",
    },
];

const STATS = [
    { value: "10+", label: "Năm kinh nghiệm" },
    { value: "50K+", label: "Lô hàng thành công" },
    { value: "80+", label: "Quốc gia kết nối" },
    { value: "99.2%", label: "Tỷ lệ giao hàng đúng hẹn" },
];

const WHY_US = [
    "Đội ngũ chuyên gia logistics 10+ năm kinh nghiệm",
    "Đối tác chính thức của các hãng hàng không lớn",
    "Báo giá minh bạch, không phát sinh chi phí ẩn",
    "Hỗ trợ khách hàng 24/7 bằng tiếng Việt",
    "Bảo hiểm hàng hóa toàn diện theo yêu cầu",
    "Hệ thống CRM quản lý đơn hàng hiện đại",
];

const CARGO_TYPES = [
    "Hàng thương mại thông thường",
    "Hàng lạnh / dược phẩm",
    "Hàng nguy hiểm (DG)",
    "Hàng giá trị cao",
    "Hàng quá khổ",
    "Hàng sống / động vật",
    "Hàng điện tử",
    "Khác",
];

type FormData = {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    origin: string;
    destination: string;
    cargoType: string;
    weight: string;
    message: string;
};

type FormStatus = "idle" | "loading" | "success" | "error";

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: "", email: "", phone: "", company: "",
        origin: "", destination: "", cargoType: "", weight: "", message: "",
    });
    const [status, setStatus] = useState<FormStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const heroRef = useInView();
    const statsRef = useInView();
    const servicesRef = useInView();
    const whyRef = useInView();
    const contactRef = useInView();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gửi thất bại");
            setStatus("success");
            setFormData({ fullName: "", email: "", phone: "", company: "", origin: "", destination: "", cargoType: "", weight: "", message: "" });
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message);
        }
    };

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

            {/* ── NAVBAR ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
                <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
                    {/* Logo */}
                    <div className="flex items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/fada-logo.png" alt="Fada Express" className="rounded-2xl" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        {[["Dịch vụ", "services"], ["Tại sao chọn chúng tôi", "why-us"], ["Liên hệ", "contact"]].map(([label, id]) => (
                            <button key={id} onClick={() => scrollTo(id)}
                                className={`text-sm font-medium transition-colors hover:text-orange-400 ${scrolled ? "text-gray-600" : "text-white/90"}`}>
                                {label}
                            </button>
                        ))}
                        <Link href="/tracking"
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-orange-400 ${scrolled ? "text-gray-600" : "text-white/90"}`}>
                            <Search className="w-3.5 h-3.5" />
                            Tra cứu đơn hàng
                        </Link>
                        <button onClick={() => scrollTo("contact")}
                            className="bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-105">
                            Báo giá ngay
                        </button>
                    </div>

                    <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen
                            ? <X className={`w-6 h-6 ${scrolled ? "text-gray-700" : "text-white"}`} />
                            : <Menu className={`w-6 h-6 ${scrolled ? "text-gray-700" : "text-white"}`} />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 shadow-lg">
                        {[["Dịch vụ", "services"], ["Tại sao chọn chúng tôi", "why-us"], ["Liên hệ", "contact"]].map(([label, id]) => (
                            <button key={id} onClick={() => scrollTo(id)} className="text-gray-700 font-medium text-left text-sm">
                                {label}
                            </button>
                        ))}
                        <Link href="/tracking" className="text-gray-700 font-medium text-sm flex items-center gap-1.5">
                            <Search className="w-4 h-4" /> Tra cứu đơn hàng
                        </Link>
                        <button onClick={() => scrollTo("contact")}
                            className="bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full text-center">
                            Báo giá ngay
                        </button>
                    </div>
                )}
            </nav>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
                </div>

                <div ref={heroRef.ref} className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 pt-24 md:pt-0 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 md:mb-8">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                        <span className="text-white/80 text-xs sm:text-sm font-medium">Đang phục vụ 80+ quốc gia trên toàn cầu</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-5 md:mb-6">
                        Vận chuyển hàng không
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 mt-2">
                            Nhanh — Tin cậy — Toàn cầu
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2 md:px-0">
                        Fada Express là đối tác logistics hàng không đáng tin cậy của hàng ngàn doanh nghiệp Việt Nam. 
                        Kết nối bạn với thế giới qua mạng lưới 80+ quốc gia và 150+ sân bay.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0">
                        <button onClick={() => scrollTo("contact")}
                            className="group bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                            Nhận báo giá miễn phí
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => scrollTo("services")}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                            Xem dịch vụ
                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <ChevronDown className="w-6 h-6 text-white/40" />
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500">
                <div ref={statsRef.ref} className={`max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${statsRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    {STATS.map((s, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">{s.value}</div>
                            <div className="text-orange-100 text-sm font-medium">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SERVICES ── */}
            <section id="services" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={servicesRef.ref} className={`text-center mb-16 transition-all duration-700 ${servicesRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <span className="inline-block bg-orange-50 text-orange-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Dịch vụ của chúng tôi</span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Giải pháp logistics toàn diện</h2>
                        <p className="text-gray-500 text-sm md:text-lg max-w-2xl mx-auto">Từ hàng thương mại thông thường đến hàng đặc biệt, chúng tôi có giải pháp phù hợp cho mọi nhu cầu.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SERVICES.map((s, i) => (
                            <div key={i}
                                className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-5`}>
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                                        <s.icon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-3">{s.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY US ── */}
            <section id="why-us" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div ref={whyRef.ref} className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${whyRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <div>
                            <span className="inline-block bg-orange-50 text-orange-500 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Tại sao chọn Fada Express?</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                Chúng tôi không chỉ vận chuyển,
                                <span className="text-orange-500"> chúng tôi cam kết</span>
                            </h2>
                            <p className="text-gray-500 text-lg leading-relaxed mb-8">
                                Với hơn 10 năm kinh nghiệm trong ngành logistics hàng không, Fada Express đã và đang là lựa chọn tin cậy của hàng nghìn doanh nghiệp xuất nhập khẩu Việt Nam.
                            </p>
                            <div className="space-y-4">
                                {WHY_US.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => scrollTo("contact")}
                                className="mt-10 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-7 py-3.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-105">
                                Liên hệ tư vấn
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 text-white">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <Globe className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Mạng lưới toàn cầu</p>
                                        <p className="text-orange-200 text-sm">80+ quốc gia & vùng lãnh thổ</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { route: "HAN → CDG (Paris)", time: "12 giờ", status: "on_time" },
                                        { route: "SGN → NRT (Tokyo)", time: "6 giờ", status: "on_time" },
                                        { route: "HAN → LAX (Los Angeles)", time: "18 giờ", status: "on_time" },
                                        { route: "SGN → SYD (Sydney)", time: "10 giờ", status: "on_time" },
                                    ].map((r, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Plane className="w-4 h-4 text-orange-200" />
                                                <span className="font-medium text-sm">{r.route}</span>
                                            </div>
                                            <span className="text-orange-200 text-sm font-semibold">{r.time}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-orange-200 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Tất cả chuyến bay đang hoạt động đúng lịch
                                </div>
                            </div>

                                <div className="hidden sm:block absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                        <Star className="w-5 h-5 text-green-500 fill-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">4.9/5</p>
                                        <p className="text-gray-400 text-xs">1,200+ đánh giá</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONTACT FORM ── */}
            <section id="contact" className="py-24 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
                <div className="max-w-5xl mx-auto px-6">
                    <div ref={contactRef.ref} className={`transition-all duration-700 ${contactRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <div className="text-center mb-12">
                            <span className="inline-block bg-orange-500/20 text-orange-200 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Liên hệ chúng tôi</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Nhận báo giá miễn phí</h2>
                            <p className="text-white/60 text-sm md:text-lg">Điền thông tin bên dưới, chuyên gia của chúng tôi sẽ liên hệ trong vòng 30 phút.</p>
                        </div>

                        <div className="grid md:grid-cols-5 gap-8">
                            {/* Contact Info */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-white font-bold text-lg mb-5">Thông tin liên hệ</h3>
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                <Phone className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs mb-1">Hotline</p>
                                                <a href="tel:0795666672" className="text-white font-semibold hover:text-orange-200 transition-colors">0795.6666.72</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                <Mail className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs mb-1">Email</p>
                                                <a href="mailto:atus@fadalogisticsvn.com" className="text-white font-semibold hover:text-orange-200 transition-colors break-all">atus@fadalogisticsvn.com</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs mb-1">Văn phòng</p>
                                                <p className="text-white font-semibold text-sm leading-relaxed">Ô 8 Lô C, Đường HPN3, Khu Phố Bình Hòa, P. Lái Thiêu, TP. Thuận An, Bình Dương</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-600/20 to-amber-500/15 border border-orange-500/20 rounded-2xl p-6">
                                    <p className="text-white font-semibold mb-2">Phản hồi nhanh chóng</p>
                                    <p className="text-white/60 text-sm">Chúng tôi cam kết phản hồi mọi yêu cầu trong vòng <span className="text-orange-300 font-semibold">30 phút</span> trong giờ hành chính.</p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="md:col-span-3">
                                {status === "success" ? (
                                    <div className="bg-white/5 border border-green-500/30 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-5">
                                            <CheckCircle className="w-10 h-10 text-green-400" />
                                        </div>
                                        <h3 className="text-white text-2xl font-bold mb-3">Gửi thành công!</h3>
                                        <p className="text-white/60 text-base mb-6">Cảm ơn bạn đã liên hệ. Chuyên gia của chúng tôi sẽ gọi lại trong vòng 30 phút.</p>
                                        <button onClick={() => setStatus("idle")}
                                            className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-500 transition-colors">
                                            Gửi yêu cầu khác
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Họ và tên <span className="text-red-400">*</span></label>
                                                <input name="fullName" value={formData.fullName} onChange={handleChange} required
                                                    placeholder="Nguyễn Văn A"
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Số điện thoại <span className="text-red-400">*</span></label>
                                                <input name="phone" value={formData.phone} onChange={handleChange} required
                                                    placeholder="0901 234 567"
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Email <span className="text-red-400">*</span></label>
                                                <input name="email" type="email" value={formData.email} onChange={handleChange} required
                                                    placeholder="email@company.com"
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Tên công ty</label>
                                                <input name="company" value={formData.company} onChange={handleChange}
                                                    placeholder="Công ty TNHH..."
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Điểm xuất phát</label>
                                                <input name="origin" value={formData.origin} onChange={handleChange}
                                                    placeholder="VD: HAN, SGN..."
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Điểm đến</label>
                                                <input name="destination" value={formData.destination} onChange={handleChange}
                                                    placeholder="VD: LAX, CDG..."
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Loại hàng hóa</label>
                                                <select name="cargoType" value={formData.cargoType} onChange={handleChange}
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-400 transition-all appearance-none">
                                                    <option value="" className="bg-slate-900">Chọn loại hàng</option>
                                                    {CARGO_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Trọng lượng ước tính</label>
                                                <input name="weight" value={formData.weight} onChange={handleChange}
                                                    placeholder="VD: 500 kg"
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-white/60 text-xs font-medium mb-1.5">Nội dung cần tư vấn</label>
                                                <textarea name="message" value={formData.message} onChange={handleChange}
                                                    rows={3} placeholder="Mô tả nhu cầu vận chuyển của bạn..."
                                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all resize-none" />
                                            </div>
                                        </div>

                                        {status === "error" && (
                                            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{errorMsg}</p>
                                        )}

                                        <button type="submit" disabled={status === "loading"}
                                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
                                            {status === "loading" ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</>
                                            ) : (
                                                <><Send className="w-5 h-5" /> Gửi yêu cầu báo giá</>
                                            )}
                                        </button>
                                        <p className="text-white/30 text-xs text-center">Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi không chia sẻ với bên thứ ba.</p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRACKING SHORTCUT ── */}
            <section className="py-14 bg-gray-50 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                        <Search className="w-4 h-4" /> Tra cứu nhanh
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Theo dõi đơn hàng của bạn</h2>
                    <p className="text-gray-500 mb-8">Hỗ trợ tra cứu DHL, FedEx, UPS, Vietnam Airlines, Cathay Pacific và 10+ hãng hàng không quốc tế</p>
                    <Link href="/tracking"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg">
                        <Search className="w-5 h-5" />
                        Mở trang tra cứu vận đơn
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-slate-950 pt-12 pb-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-10 mb-8">
                        {/* Brand */}
                        <div>
                            <div className="mb-4 inline-block bg-white rounded-xl px-3 py-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/fada-logo.png" alt="Fada Express" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
                            </div>
                            <p className="text-white/50 text-sm leading-relaxed">
                                CÔNG TY TNHH FADA LOGISTICS<br />
                                MST: 3703354696
                            </p>
                        </div>
                        {/* Contact */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
                            <div className="space-y-2 text-sm text-white/50">
                                <p>📞 <a href="tel:0795666672" className="hover:text-white transition-colors">0795.6666.72</a></p>
                                <p>✉ <a href="mailto:atus@fadalogisticsvn.com" className="hover:text-white transition-colors">atus@fadalogisticsvn.com</a></p>
                                <p>📍 Ô 8 Lô C, Đường HPN3, Khu Phố Bình Hòa, P. Lái Thiêu, TP. Thuận An, Bình Dương, Việt Nam</p>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
                        <p className="text-white/30 text-xs text-center">© {new Date().getFullYear()} Công ty TNHH Fada Logistics. Tất cả quyền được bảo lưu.</p>
                        <div className="flex items-center gap-5">
                            <Link href="/tracking" className="text-white/40 hover:text-white/70 text-xs transition-colors">Tra cứu vận đơn</Link>
                            <a href="#" className="text-white/40 hover:text-white/70 text-xs transition-colors">Chính sách bảo mật</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
