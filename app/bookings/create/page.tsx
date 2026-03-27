"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Country, State, City } from "country-state-city";
import { 
    Package as PkgIcon, MapPin, Search, ArrowLeft, 
    Truck, Globe, Map, Plus, Trash2, ShieldCheck, 
    AlertTriangle, CreditCard, Save
} from "lucide-react";
import FormField from "@/components/ui/FormField";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export default function CreateBookingPage() {
    const router = useRouter();
    const { formatCurr } = useLanguage();
    const { showToast } = useToast();
    const { data: session } = useSession();
    
    const [customers, setCustomers] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initial Form State
    const [formData, setFormData] = useState({
        reference: `BK-${new Date().getTime().toString().slice(-6)}`,
        customerId: "",
        awbNumber: "",
        origin: "",
        destination: "",
        shipDate: "",
        etd: "",
        eta: "",
        cargoType: "",
        service: "",
        description: "",
        status: "pending",
        paymentStatus: "UNPAID",
        freightRevenue: 0,
        surcharge: 0,
        otherFees: 0,
        otherFeeLabel: "Phí phát sinh khác",
        totalCost: 0,
        amountPaid: 0,
        // Sender Address
        senderName: "",
        senderPhone: "",
        senderCountry: "",
        senderState: "",
        senderCity: "",
        senderZip: "",
        senderAddress: "",
        // Recipient Address
        recipientName: "",
        recipientPhone: "",
        recipientCountry: "",
        recipientState: "",
        recipientCity: "",
        recipientZip: "",
        recipientAddress: "",
        packages: [
            { id: Date.now().toString(), packagingType: "Carton", weight: 0, length: 0, width: 0, height: 0, description: "" }
        ],
        salesId: ""
    });

    const [senderStates, setSenderStates] = useState<any[]>([]);
    const [senderCities, setSenderCities] = useState<any[]>([]);
    const [recipientStates, setRecipientStates] = useState<any[]>([]);
    const [recipientCities, setRecipientCities] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/customers").then(res => res.json()).then(setCustomers).catch(console.error);
        fetch("/api/users").then(res => res.json()).then(setStaff).catch(console.error);
        
        // Fetch default company settings for sender
        fetch("/api/settings").then(res => res.json()).then(data => {
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    senderName: data.companyName || prev.senderName,
                    senderPhone: data.companyPhone || prev.senderPhone,
                    senderAddress: data.companyAddressDetail || data.companyAddress || prev.senderAddress,
                    senderCountry: data.companyCountry || "VN",
                    senderState: data.companyState || prev.senderState,
                    senderCity: data.companyCity || prev.senderCity,
                    salesId: (session?.user as any)?.id || ""
                }));
            }
        }).catch(console.error);
    }, [session]);

    // Effect for Sender cascading
    useEffect(() => {
        if (formData.senderCountry) {
            setSenderStates(State.getStatesOfCountry(formData.senderCountry));
        } else {
            setSenderStates([]);
            setSenderCities([]);
        }
    }, [formData.senderCountry]);

    useEffect(() => {
        if (formData.senderCountry && formData.senderState) {
            setSenderCities(City.getCitiesOfState(formData.senderCountry, formData.senderState));
        } else {
            setSenderCities([]);
        }
    }, [formData.senderState, formData.senderCountry]);

    // Effect for Recipient cascading
    useEffect(() => {
        if (formData.recipientCountry) {
            setRecipientStates(State.getStatesOfCountry(formData.recipientCountry));
        } else {
            setRecipientStates([]);
            setRecipientCities([]);
        }
    }, [formData.recipientCountry]);

    useEffect(() => {
        if (formData.recipientCountry && formData.recipientState) {
            setRecipientCities(City.getCitiesOfState(formData.recipientCountry, formData.recipientState));
        } else {
            setRecipientCities([]);
        }
    }, [formData.recipientState, formData.recipientCountry]);


    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: Number(value) || 0 }));
    };

    const addPackage = () => {
        setFormData(prev => ({
            ...prev,
            packages: [
                ...prev.packages, 
                { id: Date.now().toString(), packagingType: "Carton", weight: 0, length: 0, width: 0, height: 0, description: "" }
            ]
        }));
    };

    const removePackage = (id: string) => {
        setFormData(prev => ({
            ...prev,
            packages: prev.packages.filter(p => p.id !== id)
        }));
    };

    const handlePackageChange = (id: string, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            packages: prev.packages.map(p => 
                p.id === id ? { ...p, [field]: value } : p
            )
        }));
    };

    const totalRevenue = formData.freightRevenue + formData.surcharge + formData.otherFees;
    
    // Auto calculate total pieces and weight from packages
    const calculatedPieces = formData.packages.length;
    const calculatedWeight = formData.packages.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    // Chargeable weight usually max of actual vs volumetric
    // Volumetric weight (Air freight) = L x W x H (cm) / 6000
    const calculatedVolumetric = formData.packages.reduce((sum, p) => sum + ((Number(p.length) || 0) * (Number(p.width) || 0) * (Number(p.height) || 0)) / 6000, 0);
    const calculatedChargeable = Math.max(calculatedWeight, calculatedVolumetric);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Append calculated totals to payload
            const payload = {
                ...formData,
                totalRevenue,
                pieces: calculatedPieces,
                weight: calculatedWeight,
                volume: calculatedVolumetric, 
                chargeableWeight: calculatedChargeable
            };

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const booking = await res.json();
                showToast("success", "Tạo vận đơn thành công!");
                router.push(`/bookings/${booking.id}/edit`);
            } else {
                const data = await res.json();
                showToast("error", data.error || "Có lỗi xảy ra");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Lỗi gửi dữ liệu");
        } finally {
            setSubmitting(false);
        }
    };

    const allCountries = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
    const sStates = senderStates.map(s => ({ label: s.name, value: s.isoCode }));
    const sCities = senderCities.map(c => ({ label: c.name, value: c.name })); // Use name as value
    const rStates = recipientStates.map(s => ({ label: s.name, value: s.isoCode }));
    const rCities = recipientCities.map(c => ({ label: c.name, value: c.name }));

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Title */}
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <button onClick={() => router.back()} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight uppercase">Khởi tạo Vận đơn</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2">
                        Nhập thông tin chi tiết lô hàng
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Info */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 p-6 md:p-8 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                        <Globe className="w-4 h-4 text-brand-500" /> Thông tin Hành trình
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                        <FormField id="reference" label="Mã tham chiếu" value={formData.reference} onChange={handleChange} required />
                        <FormField id="awbNumber" label="Mã vận đơn (AWB)" value={formData.awbNumber} onChange={handleChange} />
                        <FormField 
                            id="customerId" 
                            label="Khách hàng" 
                            value={formData.customerId} 
                            onChange={handleChange} 
                            required 
                            options={[
                                { label: "-- Chọn khách hàng --", value: "" },
                                ...customers.map(c => ({ label: `${c.name} (${c.email})`, value: c.id }))
                            ]} 
                        />
                        <FormField id="origin" label="Điểm đi (Airport Code)" value={formData.origin} onChange={handleChange} required placeholder="SGN" />
                        <FormField id="destination" label="Điểm đến (Airport Code)" value={formData.destination} onChange={handleChange} required placeholder="SIN" />
                        <FormField id="cargoType" label="Tính chất hàng hóa" value={formData.cargoType} onChange={handleChange} placeholder="General, Dangerous..." />
                        <FormField id="shipDate" label="Ngày khởi hành dự kiến" type="datetime-local" value={formData.shipDate} onChange={handleChange} />
                        <FormField id="status" label="Trạng thái" value={formData.status} onChange={handleChange} 
                            options={[
                                { label: "Đang chờ (Pending)", value: "pending" },
                                { label: "Đã nhận hàng (Received)", value: "cargo_received" },
                                { label: "Đang vận chuyển (In Transit)", value: "in_transit" },
                                { label: "Giao hàng thành công", value: "delivered" }
                            ]} 
                        />
                        <FormField id="service" label="Dịch vụ hàng không" value={formData.service} onChange={handleChange} placeholder="Express, Standard..." />
                        {(session?.user as any)?.role !== 'SALE' && (
                            <FormField 
                                id="salesId" 
                                label="Nhân viên chăm sóc (CS / Sale)" 
                                value={formData.salesId} 
                                onChange={handleChange} 
                                required 
                                options={[
                                    { label: "-- Chọn nhân viên --", value: "" },
                                    ...staff.map(s => ({ label: `${s.name} (${s.role})`, value: s.id }))
                                ]} 
                            />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sender Address */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 p-8 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                            <MapPin className="w-4 h-4 text-emerald-500" /> Thông tin Người Gửi
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <FormField id="senderName" label="Tên người gửi / Công ty" value={formData.senderName} onChange={handleChange} required />
                            <FormField id="senderPhone" label="Số điện thoại" value={formData.senderPhone} onChange={handleChange} required />
                            <FormField id="senderAddress" label="Địa chỉ chi tiết (Đường, số nhà...)" value={formData.senderAddress} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Recipient Address */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 p-8 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                            <MapPin className="w-4 h-4 text-rose-500" /> Thông tin Người Nhận
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <FormField id="recipientName" label="Tên người nhận / Công ty" value={formData.recipientName} onChange={handleChange} required />
                            </div>
                            <div className="md:col-span-2">
                                <FormField id="recipientPhone" label="Số điện thoại" value={formData.recipientPhone} onChange={handleChange} required />
                            </div>
                            <FormField 
                                id="recipientCountry" 
                                label="Quốc gia" 
                                value={formData.recipientCountry} 
                                onChange={handleChange} 
                                required 
                                options={[{label: "-- Chọn Quốc Gia --", value: ""}, ...allCountries]}
                            />
                            <FormField 
                                id="recipientState" 
                                label="Tiểu bang / Tỉnh thành" 
                                value={formData.recipientState} 
                                onChange={handleChange} 
                                options={[{label: "-- Chọn Tỉnh thành --", value: ""}, ...rStates]}
                            />
                            <FormField 
                                id="recipientCity" 
                                label="Thành phố / Quận huyện" 
                                value={formData.recipientCity} 
                                onChange={handleChange} 
                                options={[{label: "-- Chọn Thành phố --", value: ""}, ...rCities]}
                            />
                            <FormField id="recipientZip" label="Mã bưu chính (Zip Code)" value={formData.recipientZip} onChange={handleChange} />
                            <div className="md:col-span-2">
                                <FormField id="recipientAddress" label="Địa chỉ chi tiết (Đường, số nhà...)" value={formData.recipientAddress} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Package Information */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                            <PkgIcon className="w-4 h-4 text-orange-500" /> Thông tin Đóng gói (Package Information)
                        </h3>
                        <button type="button" onClick={addPackage} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Thêm kiện hàng
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.packages.map((pkg, index) => (
                            <div key={pkg.id} className="bg-zinc-50 dark:bg-zinc-800/20 p-4 md:p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Kiện #{index + 1}</span>
                                    {formData.packages.length > 1 && (
                                        <button type="button" onClick={() => removePackage(pkg.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors text-[10px] font-bold uppercase tracking-widest">
                                            <Trash2 className="w-3.5 h-3.5" /> Xóa kiện
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
                                    <div className="col-span-2 md:col-span-2">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">Loại gói (Type)</label>
                                        <select 
                                            value={pkg.packagingType}
                                            onChange={(e) => handlePackageChange(pkg.id, "packagingType", e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none"
                                        >
                                            <option value="Carton">Carton</option>
                                            <option value="Pak">Pak</option>
                                            <option value="Envelope">Envelope</option>
                                            <option value="Pallet">Pallet</option>
                                            <option value="Roll">Roll</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">TL (Kg)</label>
                                        <input type="number" value={pkg.weight || ""} onChange={(e) => handlePackageChange(pkg.id, "weight", Number(e.target.value))} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 md:px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">Dài (cm)</label>
                                        <input type="number" value={pkg.length || ""} onChange={(e) => handlePackageChange(pkg.id, "length", Number(e.target.value))} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 md:px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">Rộng (cm)</label>
                                        <input type="number" value={pkg.width || ""} onChange={(e) => handlePackageChange(pkg.id, "width", Number(e.target.value))} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 md:px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none" placeholder="0" />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-2">Cao (cm)</label>
                                        <input type="number" value={pkg.height || ""} onChange={(e) => handlePackageChange(pkg.id, "height", Number(e.target.value))} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 md:px-4 py-3 text-xs font-bold focus:border-brand-500 outline-none" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Calculated Summary */}
                    <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Tổng Số Kiện</span>
                            <span className="text-sm font-black">{calculatedPieces} PCS</span>
                        </div>
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">TL Thực tế (Gross)</span>
                            <span className="text-sm font-black">{calculatedWeight.toFixed(2)} KG</span>
                        </div>
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">TL Thể tích (Volumetric)</span>
                            <span className="text-sm font-black">{calculatedVolumetric.toFixed(2)} KG</span>
                        </div>
                        <div className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                            <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block mb-1">TL Tính Cước (Chargeable)</span>
                            <span className="text-sm font-black text-brand-700 dark:text-brand-300">{calculatedChargeable.toFixed(2)} KG</span>
                        </div>
                    </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-6 md:p-8 bg-white dark:bg-zinc-900/50 rounded-[32px] border border-zinc-100 dark:border-zinc-700/50 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CreditCard className="w-24 h-24 text-zinc-900 dark:text-white" />
                    </div>
                    
                    <div className="col-span-2 md:col-span-4 flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Chi phí & Thanh toán</h3>
                    </div>

                    <FormField id="freightRevenue" label="Cước vận chuyển (VND)" type="number" value={formData.freightRevenue} onChange={handleNumberChange} />
                    <FormField id="surcharge" label="Phụ phí / Dịch vụ (VND)" type="number" value={formData.surcharge} onChange={handleNumberChange} />
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tên phí phát sinh</label>
                            <input
                                id="otherFeeLabel"
                                type="text"
                                value={formData.otherFeeLabel}
                                onChange={e => setFormData(prev => ({ ...prev, otherFeeLabel: e.target.value }))}
                                placeholder="Vd: Phí hải quan, Phí thông quan..."
                                className="h-[46px] w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>
                        <FormField id="otherFees" label="Số tiền phí phát sinh (VND)" type="number" value={formData.otherFees} onChange={handleNumberChange} />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tổng doanh thu (VNĐ)</label>
                        <div className="h-[46px] flex items-center px-4 bg-zinc-900 text-white font-bold rounded-xl shadow-lg border-2 border-transparent">
                            {formatCurr(totalRevenue)}
                        </div>
                    </div>

                    <FormField id="totalCost" label="Giá vốn / Chi phí đầu vào (VND)" type="number" value={formData.totalCost} onChange={handleNumberChange} />
                    
                    <FormField 
                        id="paymentStatus" 
                        label="Tình trạng thanh toán" 
                        value={formData.paymentStatus} 
                        onChange={handleChange} 
                        options={[
                            { label: "Đợi thanh toán", value: "UNPAID" },
                            { label: "Đã thanh toán", value: "PAID" },
                            { label: "Thanh toán một phần", value: "PARTIAL" }
                        ]} 
                    />
                    
                    <div className="md:col-span-2">
                        {formData.paymentStatus === "PARTIAL" && (
                            <FormField 
                                id="amountPaid" 
                                label="Số tiền đã thanh toán (VND)" 
                                type="number"
                                value={formData.amountPaid} 
                                onChange={handleNumberChange} 
                                required
                            />
                        )}
                    </div>

                    <div className="md:col-span-4 mt-4">
                        <FormField 
                            id="description" 
                            label="Mô tả chi tiết / Ghi chú nội bộ" 
                            type="textarea" 
                            value={formData.description} 
                            onChange={handleChange} 
                            placeholder="Nhập ghi chú hoặc mô tả chi tiết về lô hàng..."
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <button 
                        type="button" 
                        onClick={() => router.back()} 
                        className="px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all order-2 sm:order-1"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full sm:w-auto px-12 py-4 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 order-1 sm:order-2"
                    >
                        <Save className="w-5 h-5" />
                        {submitting ? "Đang xử lý..." : "Lưu vận đơn"}
                    </button>
                </div>
            </form>
        </div>
    );
}
