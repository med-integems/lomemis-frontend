import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SmartActionParams {
  actionId: string;
  params?: Record<string, any>;
}

interface SmartActionResult {
  success: boolean;
  message: string;
}

export function useSmartActions() {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const executeActionMutation = useMutation({
    mutationFn: async ({ actionId, params }: SmartActionParams): Promise<SmartActionResult> => {
      const response = await fetch('/api/dashboard/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ actionId, params }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Action failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate dashboard data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Show success notification (you can integrate with your notification system)
      console.log(`Action ${variables.actionId} completed successfully:`, data.message);
    },
    onError: (error, variables) => {
      // Show error notification
      console.error(`Action ${variables.actionId} failed:`, error.message);
    },
  });

  const executeAction = async (actionId: string, params?: Record<string, any>) => {
    const actionKey = `${actionId}-${JSON.stringify(params)}`;
    
    setLoadingActions(prev => new Set([...prev, actionKey]));
    
    try {
      await executeActionMutation.mutateAsync({ actionId, params });
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const isActionLoading = (actionId: string, params?: Record<string, any>) => {
    const actionKey = `${actionId}-${JSON.stringify(params)}`;
    return loadingActions.has(actionKey);
  };

  return {
    executeAction,
    isActionLoading,
    isExecuting: executeActionMutation.isPending,
  };
}

// Helper hook for managing action states in alert components
export function useAlertActions() {
  const smartActions = useSmartActions();
  
  const handleSmartAction = async (
    actionId: string,
    params?: Record<string, any>,
    href?: string
  ) => {
    if (href) {
      // Handle navigation actions
      window.location.href = href;
      return;
    }
    
    // Handle API actions
    await smartActions.executeAction(actionId, params);
  };

  return {
    ...smartActions,
    handleSmartAction,
  };
}