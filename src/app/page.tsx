import { LoginForm } from "@/components/auth";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Login - LoMEMIS",
  description: "LoMEMIS Homepage",
};

export default function Home() {
   return (<div className="min-h-screen bg-muted/30">
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Mobile Layout: Welcome first, then Login */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:items-center">
            {/* Welcome Message - Top on mobile, Left on desktop */}
            <div className="order-1 lg:order-1 flex justify-center lg:justify-center">
              <div className="text-center max-w-lg">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-800 mb-4">
                  Welcome to LoMEMIS
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  A Country-wide Supply Chain Management Information System.
                </p>
              </div>
            </div>
            {/* Login Form - Bottom on mobile, Right on desktop */}
            <div className="order-2 lg:order-2 flex justify-center lg:justify-start mt-8 lg:mt-0">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>)
}
