import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

export function HelpInfo({ title, text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <Info className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden bg-white">
        <DialogHeader className="p-0 border-0 mb-4 bg-transparent shrink-0">
          <div className="flex justify-between items-center w-full">
            <DialogTitle className="font-black text-sm text-primary flex items-center gap-2 uppercase tracking-wider">
              <Info className="w-4 h-4" />
              {title || 'Información'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="w-11 h-11 rounded-full bg-gray-100 text-gray-400 p-0 m-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="text-sm text-text-muted leading-relaxed font-medium">
          {text}
        </div>
        <Button
          onClick={() => setOpen(false)}
          className="w-full mt-6"
          size="lg"
        >
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
