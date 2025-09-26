import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ResponsiveLayoutProvider } from "@/components/layout/responsive-layout-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ResponsiveLayoutProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-muted/30 relative overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <div className="px-4 md:px-6 py-2 md:py-3 border-b border-border bg-card">
                <Breadcrumb />
              </div>
              <main className="flex-1 flex flex-col px-4 md:px-6 py-4 md:py-6 overflow-auto">
                <div className="flex-1 max-w-full">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </div>
        </SidebarProvider>
      </ResponsiveLayoutProvider>
    </ProtectedRoute>
  );
}
