import { useState, useEffect } from 'react';
import { generateSmartInsights, generateLocalAIInsights, type PerformanceData as PerfData } from '../services/aiInsights';

export const useAIInsights = (data: PerfData | null) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!data) {
      setInsights('');
      return;
    }
    
    const loadInsights = async () => {
      setLoading(true);
      try {
        // Try AI first, fall back to local
        const aiInsight = await generateSmartInsights(data);
        setInsights(aiInsight);
      } catch (error) {
        console.error('Failed to generate insights:', error);
        // Fallback to local insights
        const fallbackInsight = generateLocalAIInsights(data);
        setInsights(fallbackInsight);
      } finally {
        setLoading(false);
      }
    };
    
    loadInsights();
  }, [data]);
  
  return { insights, loading };
};


