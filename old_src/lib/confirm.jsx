import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';

const confirmState = atom({
  isOpen: false,
  message: '',
  options: {},
  resolve: null,
});

export function openConfirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    confirmState.set({ isOpen: true, message, options, resolve });
  });
}

function ConfirmDialog() {
  const state = useStore(confirmState);
  const { isOpen, message, options, resolve } = state;
  const { confirmText = 'Eliminar', isDestructive = true } = options;

  if (!isOpen) return null;

  const close = (result) => {
    resolve?.(result);
    confirmState.set({ isOpen: false, message: '', options: {}, resolve: null });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogDescription className="text-foreground font-medium text-base text-center sm:text-left mt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:gap-0 mt-4">
          <AlertDialogCancel onClick={() => close(false)} className="flex-1 mt-0">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => close(true)}
            variant={isDestructive ? 'destructive' : 'default'}
            className="flex-1"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmDialogWrapper() {
  return <ConfirmDialog />;
}

export const confirmDialog = openConfirmDialog;
