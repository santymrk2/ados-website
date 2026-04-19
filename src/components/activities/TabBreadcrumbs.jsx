"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function TabBreadcrumbs({ tabs, currentTab, onTabChange, mode = "edit" }) {
  const currentTabData = tabs.find((t) => t.value === currentTab);
  const currentTabIndex = tabs.findIndex((t) => t.value === currentTab);

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
      <span className="text-xs font-bold text-text-muted uppercase whitespace-nowrap">
        {mode === "edit" ? "Editar" : mode === "new" ? "Nueva" : "Ver"} Actividad:
      </span>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab, index) => (
          <div key={tab.value} className="flex items-center gap-1 whitespace-nowrap">
            <Button
              variant={currentTab === tab.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-2 py-1 text-xs font-bold uppercase",
                currentTab === tab.value
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-primary hover:bg-primary/10"
              )}
            >
              {tab.label}
            </Button>
            {index < tabs.length - 1 && (
              <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
