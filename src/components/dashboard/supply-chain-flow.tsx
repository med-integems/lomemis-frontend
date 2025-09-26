"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  Warehouse, 
  Building2, 
  GraduationCap, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import { FlowStage } from "./flow-stage";

interface FlowStageData {
  id: string;
  name: string;
  type: 'warehouse' | 'council' | 'school';
  status: 'healthy' | 'attention' | 'critical';
  metrics: {
    itemCount: number;
    processingTime: number;
    efficiency: number;
    bottleneckScore: number;
  };
  recentActivity: {
    inbound: number;
    outbound: number;
    pending: number;
  };
  coordinates?: {
    x: number;
    y: number;
  };
}

interface FlowConnection {
  from: string;
  to: string;
  status: 'active' | 'delayed' | 'blocked';
  volume: number;
  avgTransitTime: number;
  bottleneckLevel: 'none' | 'minor' | 'major' | 'critical';
}

interface SupplyChainFlow {
  stages: FlowStageData[];
  connections: FlowConnection[];
  overallMetrics: {
    totalItems: number;
    avgFlowTime: number;
    efficiency: number;
    bottlenecks: number;
  };
  timestamp: string;
}

interface SupplyChainFlowProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SupplyChainFlow({ 
  className = "", 
  autoRefresh = false, 
  refreshInterval = 30000 
}: SupplyChainFlowProps) {
  const [flowData, setFlowData] = useState<SupplyChainFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Mobile-specific state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'overview' | 'stages'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    warehouses: true,
    councils: true,
    schools: false
  });

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fetch supply chain flow data
  const fetchFlowData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/supply-chain-flow', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supply chain flow data');
      }

      const result = await response.json();
      setFlowData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowData();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchFlowData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Organize stages by type for layout
  const organizedStages = useMemo(() => {
    if (!flowData) return { warehouses: [], councils: [], schools: [] };

    return {
      warehouses: flowData.stages.filter(stage => stage.type === 'warehouse'),
      councils: flowData.stages.filter(stage => stage.type === 'council'),
      schools: flowData.stages.filter(stage => stage.type === 'school'),
    };
  }, [flowData]);

  // Get connection between two stages
  const getConnection = (fromId: string, toId: string): FlowConnection | null => {
    if (!flowData) return null;
    return flowData.connections.find(conn => conn.from === fromId && conn.to === toId) || null;
  };

  // Identify bottlenecks in the supply chain
  const identifyBottlenecks = useMemo(() => {
    if (!flowData) return { stages: [], connections: [], severity: 'none' };

    const bottleneckStages = flowData.stages.filter(stage => 
      stage.metrics.bottleneckScore > 0.4 || 
      stage.status === 'critical' ||
      (stage.recentActivity.pending > 10 && stage.metrics.efficiency < 70)
    );

    const bottleneckConnections = flowData.connections.filter(conn =>
      conn.bottleneckLevel === 'major' || 
      conn.bottleneckLevel === 'critical' ||
      conn.status === 'blocked'
    );

    let severity = 'none';
    if (bottleneckStages.some(s => s.status === 'critical') || bottleneckConnections.some(c => c.bottleneckLevel === 'critical')) {
      severity = 'critical';
    } else if (bottleneckStages.length > 0 || bottleneckConnections.length > 0) {
      severity = 'moderate';
    }

    return {
      stages: bottleneckStages,
      connections: bottleneckConnections,
      severity
    };
  }, [flowData]);

  // Get bottleneck highlighting for stages
  const getBottleneckHighlight = (stageId: string) => {
    const isBottleneck = identifyBottlenecks.stages.some(s => s.id === stageId);
    if (!isBottleneck) return '';
    
    const stage = identifyBottlenecks.stages.find(s => s.id === stageId);
    if (stage?.status === 'critical' || (stage?.metrics?.bottleneckScore || 0) > 0.7) {
      return 'ring-2 ring-red-500 ring-offset-2 shadow-lg shadow-red-200/50 animate-pulse';
    } else {
      return 'ring-2 ring-yellow-500 ring-offset-2 shadow-md shadow-yellow-200/50';
    }
  };

  // Toggle section expansion (mobile)
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render collapsible section header for mobile
  const renderSectionHeader = (type: FlowStageData['type'], title: string, count: number, expanded: boolean) => (
    <button
      onClick={() => toggleSection(type)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border touch-manipulation"
    >
      <div className="flex items-center gap-2">
        {getStageIcon(type)}
        <span className="font-medium">{title}</span>
        <Badge variant="secondary" className="ml-2">
          {count}
        </Badge>
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-gray-600" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-600" />
      )}
    </button>
  );

  // Render stage icon
  const getStageIcon = (type: FlowStageData['type']) => {
    switch (type) {
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
      case 'council':
        return <Building2 className="h-5 w-5" />;
      case 'school':
        return <GraduationCap className="h-5 w-5" />;
    }
  };

  // Render status badge
  const getStatusBadge = (status: FlowStageData['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Healthy
        </Badge>;
      case 'attention':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Attention
        </Badge>;
      case 'critical':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>;
    }
  };

  // Render connection arrow with status
  const renderConnection = (connection: FlowConnection | null, fromType: string, toType: string) => {
    if (!connection) {
      return (
        <div className="flex items-center justify-center px-4">
          <ArrowRight className="h-4 w-4 text-gray-300" />
        </div>
      );
    }

    const getConnectionColor = () => {
      switch (connection.status) {
        case 'active':
          return 'text-green-600';
        case 'delayed':
          return 'text-yellow-600 animate-pulse';
        case 'blocked':
          return 'text-red-600 animate-bounce';
      }
    };

    const getBottleneckIndicator = () => {
      switch (connection.bottleneckLevel) {
        case 'critical':
          return 'border-red-500 bg-red-50 animate-pulse shadow-lg shadow-red-200/50';
        case 'major':
          return 'border-orange-500 bg-orange-50 animate-pulse shadow-md shadow-orange-200/50';
        case 'minor':
          return 'border-yellow-500 bg-yellow-50 shadow-sm shadow-yellow-200/50';
        default:
          return 'border-gray-300 bg-gray-50 hover:shadow-md transition-shadow duration-200';
      }
    };

    return (
      <div className="flex flex-col items-center px-2 sm:px-4 relative">
        {/* Animated flow background for high-volume connections */}
        {connection.volume > 20 && connection.status === 'active' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-30 animate-pulse rounded-lg" />
        )}
        
        <div className={`flex items-center justify-center p-3 rounded-lg border-2 relative transition-all duration-300 ${getBottleneckIndicator()}`}>
          <ArrowRight className={`h-5 w-5 ${getConnectionColor()} transition-colors duration-300`} />
          
          {/* Volume flow indicator */}
          {connection.volume > 10 && (
            <div className="absolute -top-1 -right-1">
              <div className={`w-2 h-2 rounded-full ${connection.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            </div>
          )}
        </div>
        
        <div className="text-xs text-center mt-2 space-y-1 relative z-10">
          <div className={`font-medium ${connection.volume > 50 ? 'text-green-600 font-bold' : connection.volume > 20 ? 'text-blue-600' : 'text-gray-600'}`}>
            {connection.volume} items
          </div>
          <div className="text-gray-600">
            {connection.avgTransitTime.toFixed(1)}d avg
          </div>
          {connection.bottleneckLevel !== 'none' && (
            <Badge 
              variant={connection.bottleneckLevel === 'critical' ? 'destructive' : 'outline'} 
              className={`text-xs ${connection.bottleneckLevel === 'critical' ? 'animate-pulse' : ''}`}
            >
              <AlertTriangle className="h-2 w-2 mr-1" />
              {connection.bottleneckLevel}
            </Badge>
          )}
          {connection.status === 'blocked' && (
            <div className="text-red-600 font-medium animate-bounce text-xs">
              BLOCKED
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Supply Chain Flow
              </CardTitle>
              <CardDescription>Real-time pipeline visualization</CardDescription>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-32" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supply Chain Flow Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchFlowData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!flowData) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Supply Chain Flow
            </CardTitle>
            <CardDescription>
              Real-time pipeline visualization • Last updated: {lastUpdated?.toLocaleTimeString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-refresh
              </Badge>
            )}
            <Button onClick={fetchFlowData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-xl font-bold">{flowData.overallMetrics.totalItems.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Avg Flow Time</div>
              <div className="text-xl font-bold">{flowData.overallMetrics.avgFlowTime.toFixed(1)}d</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Efficiency</div>
              <div className="text-xl font-bold flex items-center gap-1">
                {flowData.overallMetrics.efficiency.toFixed(0)}%
                {flowData.overallMetrics.efficiency > 85 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <div className={`rounded-lg p-3 transition-colors duration-300 ${
              identifyBottlenecks.severity === 'critical' 
                ? 'bg-red-50 border border-red-200' 
                : identifyBottlenecks.severity === 'moderate'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-gray-50'
            }`}>
              <div className="text-sm text-gray-600">Bottlenecks</div>
              <div className="text-xl font-bold flex items-center gap-1">
                <span className={
                  identifyBottlenecks.severity === 'critical' 
                    ? 'text-red-600' 
                    : identifyBottlenecks.severity === 'moderate'
                    ? 'text-yellow-600'
                    : 'text-gray-900'
                }>
                  {identifyBottlenecks.stages.length + identifyBottlenecks.connections.length}
                </span>
                {identifyBottlenecks.severity === 'critical' && (
                  <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" />
                )}
                {identifyBottlenecks.severity === 'moderate' && (
                  <AlertTriangle className="h-4 w-4 text-yellow-600 animate-pulse" />
                )}
              </div>
              {identifyBottlenecks.severity !== 'none' && (
                <div className={`text-xs mt-1 ${
                  identifyBottlenecks.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {identifyBottlenecks.stages.length} stages, {identifyBottlenecks.connections.length} connections
                </div>
              )}
            </div>
          </div>

          {/* Flow Visualization */}
          <div className="space-y-4">
            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between">
                {/* Warehouses */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    {getStageIcon('warehouse')}
                    National Warehouses
                  </h3>
                  <div className="space-y-2">
                    {organizedStages.warehouses.map((stage) => (
                      <FlowStage
                        key={stage.id}
                        stage={stage}
                        isSelected={selectedStage === stage.id}
                        onClick={setSelectedStage}
                        compact
                        className={getBottleneckHighlight(stage.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Warehouse → Council Connections */}
                <div className="flex flex-col items-center gap-2 px-6">
                  {organizedStages.warehouses.length > 0 && organizedStages.councils.length > 0 && (
                    renderConnection(
                      getConnection(organizedStages.warehouses[0]?.id, organizedStages.councils[0]?.id),
                      'warehouse',
                      'council'
                    )
                  )}
                </div>

                {/* Councils */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    {getStageIcon('council')}
                    Local Councils
                  </h3>
                  <div className="space-y-2">
                    {organizedStages.councils.map((stage) => (
                      <FlowStage
                        key={stage.id}
                        stage={stage}
                        isSelected={selectedStage === stage.id}
                        onClick={setSelectedStage}
                        compact
                        className={getBottleneckHighlight(stage.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Council → School Connections */}
                <div className="flex flex-col items-center gap-2 px-6">
                  {organizedStages.councils.length > 0 && organizedStages.schools.length > 0 && (
                    renderConnection(
                      getConnection(organizedStages.councils[0]?.id, organizedStages.schools[0]?.id),
                      'council',
                      'school'
                    )
                  )}
                </div>

                {/* Schools */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    {getStageIcon('school')}
                    Schools
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {organizedStages.schools.map((stage) => (
                      <FlowStage
                        key={stage.id}
                        stage={stage}
                        isSelected={selectedStage === stage.id}
                        onClick={setSelectedStage}
                        compact
                        className={getBottleneckHighlight(stage.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-4">
              {/* Mobile View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMobileView('overview')}
                  className={`flex-1 text-center py-2 px-4 rounded-md transition-colors touch-manipulation ${
                    mobileView === 'overview'
                      ? 'bg-white text-blue-600 shadow-sm font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setMobileView('stages')}
                  className={`flex-1 text-center py-2 px-4 rounded-md transition-colors touch-manipulation ${
                    mobileView === 'stages'
                      ? 'bg-white text-blue-600 shadow-sm font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  Detailed Flow
                </button>
              </div>

              {/* Mobile Overview View */}
              {mobileView === 'overview' && (
                <div className="space-y-4">
                  {/* Key Metrics - Mobile optimized */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">Total Items</div>
                      <div className="text-lg font-bold">{flowData.overallMetrics.totalItems.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600">Efficiency</div>
                      <div className="text-lg font-bold flex items-center gap-1">
                        {flowData.overallMetrics.efficiency.toFixed(0)}%
                        {flowData.overallMetrics.efficiency > 85 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottleneck Alert */}
                  {identifyBottlenecks.severity !== 'none' && (
                    <div className={`p-3 rounded-lg border ${
                      identifyBottlenecks.severity === 'critical' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          identifyBottlenecks.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <span className="font-medium text-sm">
                          {identifyBottlenecks.severity === 'critical' ? 'Critical' : 'Moderate'} Bottlenecks Detected
                        </span>
                      </div>
                      <div className="text-xs mt-1 text-gray-600">
                        {identifyBottlenecks.stages.length} stages, {identifyBottlenecks.connections.length} connections affected
                      </div>
                    </div>
                  )}

                  {/* Quick Stage Summary */}
                  <div className="space-y-3">
                    {organizedStages.warehouses.length > 0 && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStageIcon('warehouse')}
                            <span className="font-medium">Warehouses</span>
                          </div>
                          <Badge variant="secondary">{organizedStages.warehouses.length}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {organizedStages.warehouses.filter(s => s.status === 'critical').length} critical, {' '}
                          {organizedStages.warehouses.filter(s => s.status === 'attention').length} attention needed
                        </div>
                      </div>
                    )}
                    
                    {organizedStages.councils.length > 0 && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStageIcon('council')}
                            <span className="font-medium">Local Councils</span>
                          </div>
                          <Badge variant="secondary">{organizedStages.councils.length}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {organizedStages.councils.filter(s => s.status === 'critical').length} critical, {' '}
                          {organizedStages.councils.filter(s => s.status === 'attention').length} attention needed
                        </div>
                      </div>
                    )}
                    
                    {organizedStages.schools.length > 0 && (
                      <div className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStageIcon('school')}
                            <span className="font-medium">Schools</span>
                          </div>
                          <Badge variant="secondary">{organizedStages.schools.length}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {organizedStages.schools.filter(s => s.status === 'critical').length} critical, {' '}
                          {organizedStages.schools.filter(s => s.status === 'attention').length} attention needed
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Detailed Flow View */}
              {mobileView === 'stages' && (
                <div className="space-y-4">
                  {/* Warehouses Section */}
                  {organizedStages.warehouses.length > 0 && (
                    <div className="space-y-2">
                      {renderSectionHeader('warehouse', 'National Warehouses', organizedStages.warehouses.length, expandedSections.warehouses)}
                      {expandedSections.warehouses && (
                        <div className="space-y-2 pl-4">
                          {organizedStages.warehouses.map((stage) => (
                            <FlowStage
                              key={stage.id}
                              stage={stage}
                              isSelected={selectedStage === stage.id}
                              onClick={setSelectedStage}
                              className={getBottleneckHighlight(stage.id)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connection Flow */}
                  {organizedStages.warehouses.length > 0 && organizedStages.councils.length > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="transform rotate-90">
                        {renderConnection(
                          getConnection(organizedStages.warehouses[0]?.id, organizedStages.councils[0]?.id),
                          'warehouse',
                          'council'
                        )}
                      </div>
                    </div>
                  )}

                  {/* Councils Section */}
                  {organizedStages.councils.length > 0 && (
                    <div className="space-y-2">
                      {renderSectionHeader('council', 'Local Councils', organizedStages.councils.length, expandedSections.councils)}
                      {expandedSections.councils && (
                        <div className="space-y-2 pl-4">
                          {organizedStages.councils.map((stage) => (
                            <FlowStage
                              key={stage.id}
                              stage={stage}
                              isSelected={selectedStage === stage.id}
                              onClick={setSelectedStage}
                              className={getBottleneckHighlight(stage.id)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connection Flow */}
                  {organizedStages.councils.length > 0 && organizedStages.schools.length > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="transform rotate-90">
                        {renderConnection(
                          getConnection(organizedStages.councils[0]?.id, organizedStages.schools[0]?.id),
                          'council',
                          'school'
                        )}
                      </div>
                    </div>
                  )}

                  {/* Schools Section */}
                  {organizedStages.schools.length > 0 && (
                    <div className="space-y-2">
                      {renderSectionHeader('school', 'Schools', organizedStages.schools.length, expandedSections.schools)}
                      {expandedSections.schools && (
                        <div className="space-y-2 pl-4 max-h-96 overflow-y-auto">
                          {organizedStages.schools.map((stage) => (
                            <FlowStage
                              key={stage.id}
                              stage={stage}
                              isSelected={selectedStage === stage.id}
                              onClick={setSelectedStage}
                              className={getBottleneckHighlight(stage.id)}
                              compact
                            />
                          ))}
                        </div>
                      )}
                      {!expandedSections.schools && organizedStages.schools.some(s => identifyBottlenecks.stages.some(bs => bs.id === s.id)) && (
                        <div className="text-xs text-red-600 text-center">
                          Some schools have bottlenecks - tap to expand
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Stage Details */}
          {selectedStage && (
            <div className="bg-gray-50 rounded-lg p-4">
              {(() => {
                const stage = flowData.stages.find(s => s.id === selectedStage);
                if (!stage) return null;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        {getStageIcon(stage.type)}
                        {stage.name}
                      </h4>
                      {getStatusBadge(stage.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Items</div>
                        <div className="font-medium">{stage.metrics.itemCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Processing Time</div>
                        <div className="font-medium">{stage.metrics.processingTime.toFixed(1)}d</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Efficiency</div>
                        <div className="font-medium">{stage.metrics.efficiency.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Recent Activity</div>
                        <div className="font-medium">
                          ↓{stage.recentActivity.inbound} ↑{stage.recentActivity.outbound} ⏳{stage.recentActivity.pending}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}