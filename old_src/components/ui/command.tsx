"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Command({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command"
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-popover text-popover-foreground"
      {...props}
    />
  );
}

function CommandInput({ ...props }: React.ComponentProps<"input">) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Input className="bg-transparent border-0 py-3 h-11" {...props} />
    </div>
  );
}

function CommandList({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-list"
      className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1"
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

function CommandGroup({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-group"
      className="overflow-hidden p-1 text-foreground"
      {...props}
    />
  );
}

function CommandItem({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-item"
      className="relative flex w-full cursor-default select-none items-center rounded-2xl p-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
      {...props}
    />
  );
}

function CommandSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-separator"
      className="-mx-1 h-px bg-border"
      {...props}
    />
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
