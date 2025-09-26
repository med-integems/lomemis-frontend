"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";

interface SessionInfo {
  id: string;
  userId: number;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSessions, revokeSession, sessionId } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionData = await getSessions();
      setSessions(sessionData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load sessions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionIdToRevoke: string) => {
    try {
      await revokeSession(sessionIdToRevoke);
      toast.success("Session revoked successfully");
      await loadSessions(); // Reload sessions
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to revoke session";
      toast.error(errorMessage);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe className="w-4 h-4" />;

    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return "Unknown Device";

    const ua = userAgent.toLowerCase();
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    // Detect browser
    if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari")) browser = "Safari";
    else if (ua.includes("edge")) browser = "Edge";

    // Detect OS
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
      os = "iOS";

    return `${browser} on ${os}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadSessions} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active login sessions across different devices. You have{" "}
          {sessions.length} active session{sessions.length !== 1 ? "s" : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isCurrentSession = session.id === sessionId;

            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  isCurrentSession
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {getDeviceInfo(session.userAgent)}
                      </p>
                      {isCurrentSession && (
                        <Badge variant="secondary" className="text-xs">
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {session.ipAddress && (
                        <p>IP Address: {session.ipAddress}</p>
                      )}
                      <p>
                        Last Activity: {format(session.lastActivity, "PPp")}
                      </p>
                      <p>Created: {format(session.createdAt, "PPp")}</p>
                      <p>Expires: {format(session.expiresAt, "PPp")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={session.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {session.isActive ? "Active" : "Inactive"}
                  </Badge>

                  {!isCurrentSession && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke this session? The
                            user will be logged out from this device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Revoke Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="pt-4 border-t">
          <Button onClick={loadSessions} variant="outline" className="w-full">
            Refresh Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
