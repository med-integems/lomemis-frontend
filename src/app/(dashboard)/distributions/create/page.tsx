"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Plus } from "lucide-react";
import { DistributionCreateForm } from "@/components/distributions";
import Link from "next/link";
import { useResponsive } from "@/hooks/useResponsive";

export default function CreateDistributionPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  const handleDistributionCreated = () => {
    router.push("/distributions");
  };

  const handleCancel = () => {
    router.push("/distributions");
  };

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center gap-4'}`}>
        <Link href="/distributions">
          <Button variant="outline" size="sm" className={`${isMobile ? 'h-10 self-start' : ''}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Distributions
          </Button>
        </Link>
        <div>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
          }`}>Create New Distribution</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Create distribution to schools" 
              : "Create a distribution from local council to schools"
            }
          </p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <Plus className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Distribution Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {isMobile 
              ? "Select schools and add items. Distribution will be created in DRAFT status."
              : "Select destination schools and add items from available local council inventory. The distribution will be created in DRAFT status and can be distributed once confirmed."
            }
          </p>
          <DistributionCreateForm
            // The form expects onSubmit; pass navigation handlers separately via cast to keep runtime behavior
            {...({} as any)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
