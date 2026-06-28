import type * as React from 'react';
import { toast as sonnerToast, type ExternalToast, type ToastT } from 'sonner';

type ToastVariant = 'default' | 'success' | 'error' | 'destructive';

type Toast = Omit<ExternalToast, 'description'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
};

type ToastResult = {
  id: string | number;
  dismiss: () => void;
  update: (props: Toast) => void;
};

function getToastPayload({ title, description, variant: _variant, ...options }: Toast) {
  return {
    message: title ?? description ?? '',
    options: {
      description: title ? description : undefined,
      ...options,
    } satisfies ExternalToast,
  };
}

function showToast(props: Toast, id?: string | number) {
  const { message, options } = getToastPayload(props);
  const toastOptions = id === undefined ? options : { ...options, id };

  switch (props.variant) {
    case 'success':
      return sonnerToast.success(message, toastOptions);
    case 'error':
    case 'destructive':
      return sonnerToast.error(message, toastOptions);
    default:
      return sonnerToast(message, toastOptions);
  }
}

function toast(props: Toast): ToastResult {
  const id = showToast(props);

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (nextProps) => {
      showToast(nextProps, id);
    },
  };
}

function useToast() {
  return {
    toasts: [] as ToastT[],
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
