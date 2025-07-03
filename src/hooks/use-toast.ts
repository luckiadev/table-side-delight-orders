import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
// ✅ DURACIÓN EXTENDIDA PARA SENIORS - 8 segundos para lectura cómoda
const TOAST_REMOVE_DELAY = 8000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// ✅ FUNCIÓN TOAST MEJORADA CON PRESETS PARA SENIORS
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// ✅ TOAST ESPECIALIZADO PARA PEDIDOS - SÚPER VISIBLE
function toastPedidoExitoso(mesa: number, total: number) {
  return toast({
    title: "✅ ¡PEDIDO ENVIADO EXITOSAMENTE!",
    description: `Tu pedido para la Mesa ${mesa} ha sido enviado a la cocina. Total: $${total.toLocaleString('es-ES')}`,
    className: "bg-green-600 text-white border-green-700 shadow-2xl text-lg font-bold",
    duration: 8000,
  })
}

// ✅ TOAST PARA ERRORES - TAMBIÉN VISIBLE
function toastError(mensaje: string) {
  return toast({
    title: "❌ Error al enviar pedido",
    description: mensaje,
    className: "bg-red-600 text-white border-red-700 shadow-2xl text-lg font-bold",
    variant: "destructive",
    duration: 8000,
  })
}

// ✅ TOAST GENÉRICO MEJORADO PARA SENIORS
function toastSeniorFriendly({ title, description, type = 'success' }: {
  title: string
  description: string
  type?: 'success' | 'error' | 'warning' | 'info'
}) {
  const configs = {
    success: {
      className: "bg-green-600 text-white border-green-700 shadow-2xl text-lg font-bold",
      icon: "✅"
    },
    error: {
      className: "bg-red-600 text-white border-red-700 shadow-2xl text-lg font-bold",
      icon: "❌"
    },
    warning: {
      className: "bg-orange-600 text-white border-orange-700 shadow-2xl text-lg font-bold",
      icon: "⚠️"
    },
    info: {
      className: "bg-blue-600 text-white border-blue-700 shadow-2xl text-lg font-bold",
      icon: "ℹ️"
    }
  }

  const config = configs[type]

  return toast({
    title: `${config.icon} ${title}`,
    description,
    className: config.className,
    duration: 8000,
  })
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    toastPedidoExitoso,  // ✅ Función especializada para pedidos
    toastError,          // ✅ Función especializada para errores  
    toastSeniorFriendly, // ✅ Función genérica senior-friendly
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast, toastPedidoExitoso, toastError, toastSeniorFriendly }