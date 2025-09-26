"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";

export default function CouncilInventoryRedirect() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  useEffect(() => {
    // Redirect to new location
    router.replace("/councils/inventory");
  }, [router]);

  return (
    <div className={`flex items-center justify-center ${isMobile ? 'py-8 px-4' : 'py-12'}`}>
      <Card>
        <CardContent className={`${isMobile ? 'p-6' : 'p-8'}`}>
          <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            <Loader2 className={`animate-spin ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
            <p className={`${isMobile ? 'text-sm' : ''}`}>
              Redirecting to Council Inventory...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}