"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export interface TableAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

interface ResponsiveTableActionsProps {
  actions: TableAction[];
  className?: string;
}

export function ResponsiveTableActions({
  actions,
  className,
}: ResponsiveTableActionsProps) {
  const { isTouchDevice } = useResponsive();

  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0",
            isTouchDevice && "h-11 w-11",
            className
          )}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          if (action.separator && index > 0) {
            return (
              <React.Fragment key={`separator-${index}`}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    isTouchDevice && "py-3",
                    action.destructive && "text-destructive focus:text-destructive"
                  )}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            );
          }

          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                isTouchDevice && "py-3",
                action.destructive && "text-destructive focus:text-destructive"
              )}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}