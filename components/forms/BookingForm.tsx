"use client";

import React, { useState, useEffect } from "react";
import FormField from "@/components/ui/FormField";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BookingFormProps {
    initialData?: any;
    customers: any[];
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    submitting: boolean;
}

export default function BookingForm({ initialData, customers, onSubmit, onCancel, submitting }: BookingFormProps) {
    const { formatCurr } = useLanguage();
    
    const [formData, setFormData] = useState({
        reference: `BK-${new Date().getTime().toString().slice(-6)}`,
        awbNumber: "",
        customerId: "",
        origin: "",
        destination: "",
        pieces: 1,
        weight: 0,
        chargeableWeight: 0,
        volume: 0,
        freightRevenue: 0,
        surcharge: 0,
        otherFees: 0,
        totalRevenue: 0,
        totalCost: 0,
        shipper: "",
        cargoType: "",
        service: "",
        status: "pending",
        approvalStatus: "PENDING",
        paymentStatus: "UNPAID",
        amountPaid: 0,
        description: "",
        shipDate: "",
        etd: "",
        eta: ""
    });

    useEffect(() => {
        if (initialData) {
            const formatForInput = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().slice(0, 16) : "";
            setFormData({
                ...initialData,
                awbNumber: initialData.awbNumber || "",
                shipper: initialData.shipper || "",
                cargoType: initialData.cargoType || "",
                service: initialData.service || "",
                description: initialData.description || "",
                shipDate: formatForInput(initialData.shipDate),
                etd: formatForInput(initialData.etd),
                eta: formatForInput(initialData.eta),
                amountPaid: initialData.amountPaid || 0
            });
        }
    }, [initialData]);

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [id]: ["pieces", "weight", "chargeableWeight", "volume", "freightRevenue", "surcharge", "otherFees", "totalCost", "amountPaid"].includes(id) 
                    ? Number(value) 
                    : value
            };
            if (["freightRevenue", "surcharge", "otherFees"].includes(id)) {
                newData.totalRevenue = Number(newData.freightRevenue) + Number(newData.surcharge) + Number(newData.otherFees);
            }
            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 bg-brand-50 rounded-2xl border border-brand-100">
                    <AlertTriangle className="w-4 h-4 text-brand-500" />
                    <p className="text-[10px] font-bold text-brand-800 uppercase tracking-widest leading-loose">Lưu ý: Đơn hàng do Sale khởi tạo sẽ ở trạng thái Chờ duyệt cho đến được Admin/CS xác nhận.</p>
                </div>

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
                <FormField id="shipper" label="Người gửi (Shipper)" value={formData.shipper} onChange={handleChange} />
                <FormField id="origin" label="Điểm đi (Origin)" value={formData.origin} onChange={handleChange} required placeholder="SGN" />
                <FormField id="destination" label="Điểm đến (Dest)" value={formData.destination} onChange={handleChange} required placeholder="SIN" />
                <FormField id="shipDate" label="Ngày khởi hành dự kiến" type="datetime-local" value={formData.shipDate} onChange={handleChange} />
                <FormField id="cargoType" label="Tính chất hàng hóa" value={formData.cargoType} onChange={handleChange} placeholder="General, Dangerous..." />
                <FormField id="service" label="Dịch vụ hàng không" value={formData.service} onChange={handleChange} placeholder="Express, Standard..." />
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField id="pieces" label="Số lượng kiện" type="number" value={formData.pieces} onChange={handleChange} required />
                    <FormField id="weight" label="Trọng lượng (Gross Wt - Kg)" type="number" value={formData.weight} onChange={handleChange} required />
                    <FormField id="chargeableWeight" label="Khối lượng tính cước (Kg)" type="number" value={formData.chargeableWeight} onChange={handleChange} required />
                </div>
                
                <FormField id="volume" label="Thể tích tổng (CBM)" type="number" value={formData.volume} onChange={handleChange} required />
                
                {/* Financial Area in Modal */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard className="w-12 h-12 text-zinc-300" />
                    </div>
                    <FormField id="freightRevenue" label="Cước vận chuyển" type="number" value={formData.freightRevenue} onChange={handleChange} />
                    <FormField id="surcharge" label="Phụ phí / Dịch vụ" type="number" value={formData.surcharge} onChange={handleChange} />
                    <FormField id="otherFees" label="Phí phát sinh khác" type="number" value={formData.otherFees} onChange={handleChange} />
                    <div className="flex flex-col space-y-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tổng doanh số (VNĐ)</label>
                        <div className="h-12 flex items-center px-4 bg-zinc-900 text-white font-bold rounded-xl shadow-lg">
                            {formatCurr(formData.totalRevenue)}
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <FormField id="totalCost" label="Giá vốn (Chi phí đầu vào)" type="number" value={formData.totalCost} onChange={handleChange} />
                    </div>
                </div>

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
                
                {formData.paymentStatus === "PARTIAL" && (
                    <FormField 
                        id="amountPaid" 
                        label="Số tiền đã thanh toán (VND)" 
                        type="number"
                        value={formData.amountPaid} 
                        onChange={handleChange} 
                        required
                    />
                )}

                <FormField 
                    id="status"  
                    label="Trạng thái lô hàng" 
                    value={formData.status} 
                    onChange={handleChange} 
                    options={[
                        { label: "Đang chờ (Pending)", value: "pending" },
                        { label: "Đã nhận hàng (Received)", value: "cargo_received" },
                        { label: "Đang vận chuyển (In Transit)", value: "in_transit" },
                        { label: "Đã giao hàng (Delivered)", value: "delivered" }
                    ]} 
                />

                <div className="md:col-span-2">
                    <FormField 
                        id="description" 
                        label="Ghi chú chi tiết" 
                        type="textarea" 
                        value={formData.description} 
                        onChange={handleChange} 
                        placeholder="Nhập ghi chú hoặc hướng dẫn chi tiết về lô hàng..."
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-4 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
                <button type="button" onClick={onCancel} className="px-6 py-3 text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-900 transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={submitting} className="px-10 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:bg-brand-600 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 active:scale-95 shadow-zinc-900/20 dark:shadow-white/5">
                    {submitting ? "Đang xử lý..." : "Xác nhận & Lưu đơn"}
                </button>
            </div>
        </form>
    );
}
