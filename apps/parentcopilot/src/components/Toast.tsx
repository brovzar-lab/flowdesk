import { useEffect, useState } from 'react';

type ToastProps = { message: string; onDismiss: () => void };

export default function Toast({ message, onDismiss }: ToastProps): JSX.Element {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded-full px-4 py-2 shadow-lg transition-opacity duration-300 z-50 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
