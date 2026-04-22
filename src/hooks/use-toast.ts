"use client"

import { toast as sonner } from "sonner"

// Wrapper compatible con la API anterior de toast
const toast = {
  success: (message: string, props?: { description?: string }) => {
    sonner.success(message, {
      description: props?.description,
    })
  },
  
  error: (message: string, props?: { description?: string }) => {
    sonner.error(message, {
      description: props?.description,
    })
  },
  
  info: (message: string, props?: { description?: string }) => {
    sonner.info(message, {
      description: props?.description,
    })
  },
  
  warning: (message: string, props?: { description?: string }) => {
    sonner.warning(message, {
      description: props?.description,
    })
  },
  
  loading: (message: string, props?: { description?: string }) => {
    return sonner.loading(message, {
      description: props?.description,
    })
  },
  
  dismiss: (id?: string | number) => {
    sonner.dismiss(id)
  },
}

export { toast }