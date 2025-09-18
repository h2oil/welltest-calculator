import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  Ruler, 
  Building2, 
  Globe, 
  Save, 
  Download, 
  Upload,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { WellInfo, WellProject, WellConfiguration, COMMON_COUNTRIES, WELL_TYPES } from '@/types/well-info';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WellInfoFormProps {
  onProjectChange: (project: WellProject | null) => void;
  onConfigurationChange: (config: WellConfiguration | null) => void;
  initialProject?: WellProject | null;
  initialConfiguration?: WellConfiguration | null;
}

export const WellInfoForm: React.FC<WellInfoFormProps> = ({
  onProjectChange,
  onConfigurationChange,
  initialProject,
  initialConfiguration
}) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<WellProject | null>(initialProject || null);
  const [currentConfiguration, setCurrentConfiguration] = useState<WellConfiguration | null>(initialConfiguration || null);
  const [wellInfo, setWellInfo] = useState<WellInfo>({
    projectName: '',
    wellName: '',
    wellType: 'production',
    unitSystem: 'field'
  });
  const [savedProjects, setSavedProjects] = useState<WellProject[]>([]);
  const [savedConfigurations, setSavedConfigurations] = useState<WellConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load saved projects and configurations
  useEffect(() => {
    if (user) {
      loadSavedProjects();
      loadSavedConfigurations();
    }
  }, [user]);

  // Update well info when project changes
  useEffect(() => {
    if (currentProject) {
      setWellInfo(currentProject.wellInfo);
    }
  }, [currentProject]);

  const loadSavedProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('well_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const projects: WellProject[] = data.map(row => ({
        id: row.id,
        userId: row.user_id,
        wellInfo: {
          projectName: row.project_name,
          wellName: row.well_name,
          clientName: row.client_name,
          locationName: row.location_name,
          country: row.country,
          stateProvince: row.state_province,
          latitude: row.latitude,
          longitude: row.longitude,
          googleMapsUrl: row.google_maps_url,
          wellType: row.well_type as any,
          operatorName: row.operator_name,
          fieldName: row.field_name,
          reservoirName: row.reservoir_name,
          spudDate: row.spud_date ? new Date(row.spud_date) : undefined,
          completionDate: row.completion_date ? new Date(row.completion_date) : undefined,
          totalDepth: row.total_depth,
          measuredDepth: row.measured_depth,
          trueVerticalDepth: row.true_vertical_depth,
          unitSystem: row.unit_system as any,
          projectData: row.project_data,
          isTemplate: row.is_template,
          templateName: row.template_name
        },
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      setSavedProjects(projects);
    } catch (err) {
      // Error loading projects
      setError('Failed to load saved projects');
    }
  };

  const loadSavedConfigurations = async () => {
    if (!user || !currentProject) return;
    
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
      // Error loading configurations
      setError('Failed to load saved configurations');
    }
  };

  const saveProject = async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const projectData = {
        user_id: user.id,
        project_name: wellInfo.projectName,
        well_name: wellInfo.wellName,
        client_name: wellInfo.clientName || null,
        location_name: wellInfo.locationName || null,
        country: wellInfo.country || null,
        state_province: wellInfo.stateProvince || null,
        latitude: wellInfo.latitude || null,
        longitude: wellInfo.longitude || null,
        google_maps_url: wellInfo.googleMapsUrl || null,
        well_type: wellInfo.wellType,
        operator_name: wellInfo.operatorName || null,
        field_name: wellInfo.fieldName || null,
        reservoir_name: wellInfo.reservoirName || null,
        spud_date: wellInfo.spudDate?.toISOString().split('T')[0] || null,
        completion_date: wellInfo.completionDate?.toISOString().split('T')[0] || null,
        total_depth: wellInfo.totalDepth || null,
        measured_depth: wellInfo.measuredDepth || null,
        true_vertical_depth: wellInfo.trueVerticalDepth || null,
        unit_system: wellInfo.unitSystem,
        project_data: wellInfo.projectData || {},
        is_template: wellInfo.isTemplate || false,
        template_name: wellInfo.templateName || null
      };

      let project: WellProject;
      
      if (currentProject) {
        // Update existing project
        const { data, error } = await supabase
          .from('well_projects')
          .update(projectData)
          .eq('id', currentProject.id)
          .select()
          .single();

        if (error) throw error;
        
        project = {
          id: data.id,
          userId: data.user_id,
          wellInfo: wellInfo,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('well_projects')
          .insert(projectData)
          .select()
          .single();

        if (error) throw error;
        
        project = {
          id: data.id,
          userId: data.user_id,
          wellInfo: wellInfo,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      }
      
      setCurrentProject(project);
      onProjectChange(project);
      setSuccess('Project saved successfully');
      loadSavedProjects();
      
    } catch (err) {
      // Error saving project
      setError('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const loadProject = (project: WellProject) => {
    setCurrentProject(project);
    setWellInfo(project.wellInfo);
    onProjectChange(project);
    loadSavedConfigurations();
  };

  const createNewProject = () => {
    setCurrentProject(null);
    setCurrentConfiguration(null);
    setWellInfo({
      projectName: '',
      wellName: '',
      wellType: 'production',
      unitSystem: 'field'
    });
    onProjectChange(null);
    onConfigurationChange(null);
  };

  const createFromTemplate = (templateProject: WellProject) => {
    const templateInfo = { ...templateProject.wellInfo };
    templateInfo.projectName = `${templateInfo.projectName} - Copy`;
    templateInfo.wellName = `${templateInfo.wellName} - Copy`;
    templateInfo.isTemplate = false;
    templateInfo.templateName = undefined;
    
    setCurrentProject(null);
    setCurrentConfiguration(null);
    setWellInfo(templateInfo);
    onProjectChange(null);
    onConfigurationChange(null);
  };

  const handleInputChange = (field: keyof WellInfo, value: any) => {
    setWellInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateGoogleMapsUrl = () => {
    if (wellInfo.latitude && wellInfo.longitude) {
      const url = `https://www.google.com/maps?q=${wellInfo.latitude},${wellInfo.longitude}`;
      handleInputChange('googleMapsUrl', url);
    }
  };

  const selectedCountry = COMMON_COUNTRIES.find(c => c.code === wellInfo.country);
  const availableStates = selectedCountry?.states || [];

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-select">Load Existing Project</Label>
              <Select onValueChange={(value) => {
                const project = savedProjects.find(p => p.id === value);
                if (project) loadProject(project);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {savedProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.wellInfo.projectName}</span>
                        <span className="text-sm text-muted-foreground">
                          {project.wellInfo.wellName} • {project.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createNewProject} variant="outline">
                New Project
              </Button>
              <Button onClick={saveProject} disabled={saving}>
                {saving ? 'Saving...' : 'Save Project'}
              </Button>
            </div>
          </div>
          
          {currentProject && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Current: <strong>{currentProject.wellInfo.projectName}</strong> 
                (Last updated: {currentProject.updatedAt.toLocaleDateString()})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Well Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Well Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    value={wellInfo.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="well-name">Well Name *</Label>
                  <Input
                    id="well-name"
                    value={wellInfo.wellName}
                    onChange={(e) => handleInputChange('wellName', e.target.value)}
                    placeholder="Enter well name"
                  />
                </div>
                <div>
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    value={wellInfo.clientName || ''}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="operator-name">Operator Name</Label>
                  <Input
                    id="operator-name"
                    value={wellInfo.operatorName || ''}
                    onChange={(e) => handleInputChange('operatorName', e.target.value)}
                    placeholder="Enter operator name"
                  />
                </div>
                <div>
                  <Label htmlFor="field-name">Field Name</Label>
                  <Input
                    id="field-name"
                    value={wellInfo.fieldName || ''}
                    onChange={(e) => handleInputChange('fieldName', e.target.value)}
                    placeholder="Enter field name"
                  />
                </div>
                <div>
                  <Label htmlFor="reservoir-name">Reservoir Name</Label>
                  <Input
                    id="reservoir-name"
                    value={wellInfo.reservoirName || ''}
                    onChange={(e) => handleInputChange('reservoirName', e.target.value)}
                    placeholder="Enter reservoir name"
                  />
                </div>
                <div>
                  <Label htmlFor="well-type">Well Type</Label>
                  <Select value={wellInfo.wellType} onValueChange={(value) => handleInputChange('wellType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WELL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit-system">Unit System</Label>
                  <Select value={wellInfo.unitSystem} onValueChange={(value) => handleInputChange('unitSystem', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field">Field Units</SelectItem>
                      <SelectItem value="metric">Metric Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    value={wellInfo.locationName || ''}
                    onChange={(e) => handleInputChange('locationName', e.target.value)}
                    placeholder="Enter location name"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={wellInfo.country || ''} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_COUNTRIES.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {availableStates.length > 0 && (
                  <div>
                    <Label htmlFor="state-province">State/Province</Label>
                    <Select value={wellInfo.stateProvince || ''} onValueChange={(value) => handleInputChange('stateProvince', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state/province" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map(state => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={wellInfo.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || undefined)}
                    placeholder="Enter latitude"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={wellInfo.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || undefined)}
                    placeholder="Enter longitude"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="google-maps-url">Google Maps URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="google-maps-url"
                      value={wellInfo.googleMapsUrl || ''}
                      onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                      placeholder="Enter Google Maps URL"
                    />
                    <Button onClick={generateGoogleMapsUrl} variant="outline" size="sm">
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spud-date">Spud Date</Label>
                  <Input
                    id="spud-date"
                    type="date"
                    value={wellInfo.spudDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleInputChange('spudDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="completion-date">Completion Date</Label>
                  <Input
                    id="completion-date"
                    type="date"
                    value={wellInfo.completionDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleInputChange('completionDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="total-depth">Total Depth ({wellInfo.unitSystem === 'metric' ? 'm' : 'ft'})</Label>
                  <Input
                    id="total-depth"
                    type="number"
                    step="any"
                    value={wellInfo.totalDepth || ''}
                    onChange={(e) => handleInputChange('totalDepth', parseFloat(e.target.value) || undefined)}
                    placeholder="Enter total depth"
                  />
                </div>
                <div>
                  <Label htmlFor="measured-depth">Measured Depth ({wellInfo.unitSystem === 'metric' ? 'm' : 'ft'})</Label>
                  <Input
                    id="measured-depth"
                    type="number"
                    step="any"
                    value={wellInfo.measuredDepth || ''}
                    onChange={(e) => handleInputChange('measuredDepth', parseFloat(e.target.value) || undefined)}
                    placeholder="Enter measured depth"
                  />
                </div>
                <div>
                  <Label htmlFor="true-vertical-depth">True Vertical Depth ({wellInfo.unitSystem === 'metric' ? 'm' : 'ft'})</Label>
                  <Input
                    id="true-vertical-depth"
                    type="number"
                    step="any"
                    value={wellInfo.trueVerticalDepth || ''}
                    onChange={(e) => handleInputChange('trueVerticalDepth', parseFloat(e.target.value) || undefined)}
                    placeholder="Enter true vertical depth"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-template"
                    checked={wellInfo.isTemplate || false}
                    onChange={(e) => handleInputChange('isTemplate', e.target.checked)}
                  />
                  <Label htmlFor="is-template">Save as Template</Label>
                </div>
                {wellInfo.isTemplate && (
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={wellInfo.templateName || ''}
                      onChange={(e) => handleInputChange('templateName', e.target.value)}
                      placeholder="Enter template name"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
