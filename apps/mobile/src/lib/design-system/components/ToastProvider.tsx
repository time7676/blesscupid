import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Toast, type ToastVariant } from './Toast.js';
import { space } from '../tokens.js';

/**
 * ToastProvider — global toast context.
 *
 * Wrap App once at the root. Use `useToast()` from any descendant to
 * `show({ message, variant, duration })`. Stacks vertically; auto-dismisses
 * after `duration` (default 3500ms). Manual dismiss not exposed yet — keep
 * the API minimal until we need it.
 */

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastEntry = ToastInput & { id: number; opacity: Animated.Value };

type ToastApi = {
  show: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const show = useCallback((input: ToastInput) => {
    const id = ++idRef.current;
    const opacity = new Animated.Value(0);
    setToasts((prev) => [...prev, { ...input, id, opacity }]);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    const ms = input.duration ?? 3500;
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      );
    }, ms);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.host} pointerEvents="box-none">
        {toasts.map((t) => (
          <Animated.View key={t.id} style={{ opacity: t.opacity }}>
            <Toast variant={t.variant ?? 'success'} message={t.message} />
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.s8,
    alignItems: 'stretch',
  },
});
