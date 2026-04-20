"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  // const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      position="top-center"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--secondary)",
          "--success-text": "var(--secondary-foreground)",
          "--success-border": "var(--secondary)",
          "--error-bg": "oklch(0.6 0.25 25)", // rojo de la familia del secondary
          "--error-text": "white",
          "--error-border": "oklch(0.6 0.25 25)",
          "--warning-bg": "var(--secondary)",
          "--warning-text": "var(--secondary-foreground)",
          "--warning-border": "var(--secondary)",
          "--info-bg": "var(--secondary)",
          "--info-text": "var(--secondary-foreground)",
          "--info-border": "var(--secondary)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      swipeDirections={["right", "left"]}
      {...props}
    />
  )
}

export { Toaster }
