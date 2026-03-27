import React from "react";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
    message = "Đang xử lý thông tin hàng không...", 
    className 
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center p-20 space-y-10 animate-in fade-in duration-700", className)}>
            {/* Airplane & Track Container */}
            <div className="relative flex flex-col items-center">
                {/* Airplane Icon with Flying Animation */}
                <div className="relative z-10 animate-airplane-fly">
                    <Plane className="w-16 h-16 text-brand-500 fill-brand-500/10 stroke-[1.5px]" />
                    {/* Shadow Effect */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-zinc-900/5 dark:bg-white/5 blur-md rounded-full"></div>
                </div>

                {/* Progress Track */}
                <div className="mt-12 w-64 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-brand-500/20"></div>
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-brand-500 rounded-full animate-airplane-progress"></div>
                </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
                    {message}
                </p>
                <div className="flex justify-center gap-1">
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingState;
