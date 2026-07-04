"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = "dark"

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 shrink-0 text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-5 shrink-0 text-violet-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 shrink-0 text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-5 shrink-0 text-rose-400" />
        ),
        loading: (
          <Loader2Icon className="size-5 shrink-0 animate-spin text-emerald-400" />
        ),
      }}
      style={
        {
          "--normal-bg": "rgba(18, 18, 26, 0.95)",
          "--normal-text": "#f8fafc",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--border-radius": "12px",

          "--success-bg": "rgba(16, 185, 129, 0.08)",
          "--success-text": "#10b981",
          "--success-border": "rgba(16, 185, 129, 0.3)",

          "--error-bg": "rgba(244, 63, 94, 0.08)",
          "--error-text": "#f43f5e",
          "--error-border": "rgba(244, 63, 94, 0.3)",

          "--warning-bg": "rgba(245, 158, 11, 0.08)",
          "--warning-text": "#f59e0b",
          "--warning-border": "rgba(245, 158, 11, 0.3)",

          "--info-bg": "rgba(139, 92, 246, 0.08)",
          "--info-text": "#8b5cf6",
          "--info-border": "rgba(139, 92, 246, 0.3)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#12121a]/95 group-[.toaster]:text-slate-100 group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl rounded-xl p-4 border font-bold flex items-center gap-3 backdrop-blur-md transition-all duration-300",
          description: "group-[.toast]:text-slate-400 text-xs font-normal",
          actionButton: "group-[.toast]:bg-emerald-500 group-[.toast]:text-white hover:group-[.toast]:bg-emerald-600 transition-colors",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-slate-300 transition-colors",
          success: "group-[.toast]:border-emerald-500/30 group-[.toast]:bg-emerald-950/20 group-[.toast]:text-emerald-400",
          error: "group-[.toast]:border-rose-500/30 group-[.toast]:bg-rose-950/20 group-[.toast]:text-rose-400",
          warning: "group-[.toast]:border-amber-500/30 group-[.toast]:bg-amber-950/20 group-[.toast]:text-amber-400",
          info: "group-[.toast]:border-violet-500/30 group-[.toast]:bg-violet-950/20 group-[.toast]:text-violet-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
