import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Clock, 
  Calculator,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { WellConfiguration, WellProject } from '@/types/well-info';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ConfigurationManagerProps {
  currentProject: WellProject | null;
  currentConfiguration: WellConfiguration | null;
  onConfigurationChange: (config: WellConfiguration | null) => void;
  onSaveConfiguration: (configData: Record<string, any>) => void;
  onLoadConfiguration: (configData: Record<string, any>) => void;
}

export const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  currentProject,
  currentConfiguration,
  onConfigurationChange,
  onSaveConfiguration,
  onLoadConfiguration
}) => {
  const { user } = useAuth();
  const [savedConfigurations, setSavedConfigurations] = useState<WellConfiguration[]>([]);
  const [newConfigName, setNewConfigName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load configurations when project changes
  useEffect(() => {
    if (currentProject) {
      loadConfigurations();
    } else {
      setSavedConfigurations([]);
    }
  }, [currentProject]);

  const loadConfigurations = async () => {
    if (!user || !currentProject) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('well_configurations')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const configurations: WellConfiguration[] = data.map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        configurationName: row.configuration_name,
        configurationData: row.configuration_data,
        calculationResults: row.calculation_results,
        lastCalculatedAt: row.last_calculated_at ? new Date(row.last_calculated_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      setSavedConfigurations(configurations);
    } catch (err) {
      console.error('Error loading configurations:', err);
      setError('Failed to load saved configurations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!user || !currentProject || !newConfigName.trim()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Get current configuration data from parent component
      const configData = await getCurrentConfigurationData();
      
      const { data, error } = await supabase
        .from('well_configurations')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          configuration_name: newConfigName.trim(),
          configuration_data: configData,
          last_calculated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      const newConfig: WellConfiguration = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        configurationName: data.configuration_name,
        configurationData: data.configuration_data,
        calculationResults: data.calculation_results,
        lastCalculatedAt: data.last_calculated_at ? new Date(data.last_calculated_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setSavedConfigurations(prev => [newConfig, ...prev]);
      setNewConfigName('');
      setSuccess('Configuration saved successfully');
      
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const loadConfiguration = async (config: WellConfiguration) => {
    try {
      onConfigurationChange(config);
      onLoadConfiguration(config.configurationData);
      setSuccess(`Configuration "${config.configurationName}" loaded successfully`);
    } catch (err) {
      console.error('Error loading configuration:', err);
      setError('Failed to load configuration');
    }
  };

  const duplicateConfiguration = async (config: WellConfiguration) => {
    if (!user || !currentProject) return;
    
    try {
      const { data, error } = await supabase
        .from('well_configurations')
        .insert({
          project_id: currentProject.id,
          user_id: user.id,
          configuration_name: `${config.configurationName} - Copy`,
          configuration_data: config.configurationData,
          calculation_results: config.calculationResults,
          last_calculated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      const newConfig: WellConfiguration = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        configurationName: data.configuration_name,
        configurationData: data.configuration_data,
        calculationResults: data.calculation_results,
        lastCalculatedAt: data.last_calculated_at ? new Date(data.last_calculated_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setSavedConfigurations(prev => [newConfig, ...prev]);
      setSuccess('Configuration duplicated successfully');
      
    } catch (err) {
      console.error('Error duplicating configuration:', err);
      setError('Failed to duplicate configuration');
    }
  };

  const deleteConfiguration = async (configId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('well_configurations')
        .delete()
        .eq('id', configId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSavedConfigurations(prev => prev.filter(c => c.id !== configId));
      
      if (currentConfiguration?.id === configId) {
        onConfigurationChange(null);
      }
      
      setSuccess('Configuration deleted successfully');
      
    } catch (err) {
      console.error('Error deleting configuration:', err);
      setError('Failed to delete configuration');
    }
  };

  const exportConfiguration = (config: WellConfiguration) => {
    const exportData = {
      configuration: config,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.configurationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.configuration && data.configuration.configurationData) {
          onLoadConfiguration(data.configuration.configurationData);
          setSuccess('Configuration imported successfully');
        } else {
          setError('Invalid configuration file format');
        }
      } catch (err) {
        console.error('Error importing configuration:', err);
        setError('Failed to import configuration file');
      }
    };
    reader.readAsText(file);
  };

  // This function should be implemented by the parent component
  const getCurrentConfigurationData = async (): Promise<Record<string, any>> => {
    // This would typically collect all current form data, calculation settings, etc.
    // For now, return empty object - parent component should implement this
    return {};
  };

  if (!currentProject) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a project to manage configurations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save New Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              placeholder="Enter configuration name"
              className="flex-1"
            />
            <Button onClick={saveConfiguration} disabled={saving || !newConfigName.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-config')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              id="import-config"
              type="file"
              accept=".json"
              onChange={importConfiguration}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Saved Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Saved Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading configurations...</p>
            </div>
          ) : savedConfigurations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No saved configurations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedConfigurations.map(config => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg ${
                    currentConfiguration?.id === config.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{config.configurationName}</h4>
                        {currentConfiguration?.id === config.id && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        {config.lastCalculatedAt && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {config.lastCalculatedAt.toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {config.createdAt.toLocaleDateString()} • 
                        Updated: {config.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadConfiguration(config)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateConfiguration(config)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportConfiguration(config)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteConfiguration(config.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
