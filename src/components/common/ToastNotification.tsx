import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#143D30', '#059669', '#10B981', '#34D399', '#F59E0B']
    });
  } catch (err) {
    // Ignore in non-browser or test environments
  }
};

export const showToast = {
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 3500,
    });
  },
  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 4000,
    });
  },
  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 3500,
    });
  },
  error: (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 4500,
    });
  },
};

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      theme="light"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          borderRadius: '12px',
          border: '1px solid #E5E8EB',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
        },
      }}
    />
  );
}
