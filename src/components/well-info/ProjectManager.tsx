import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Settings, 
  FileText, 
  MapPin, 
  Calendar,
  Ruler,
  Globe,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { WellInfoForm } from './WellInfoForm';
import { ConfigurationManager } from './ConfigurationManager';
import { WellProject, WellConfiguration, WellInfo } from '@/types/well-info';
import { OpenProsperProject } from '@/types/open-prosper';

interface ProjectManagerProps {
  onProjectDataChange: (projectData: {
    wellInfo: WellInfo;
    openProsperProject: OpenProsperProject | null;
  }) => void;
  initialProject?: WellProject | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectDataChange,
  initialProject
}) => {
  const [currentProject, setCurrentProject] = useState<WellProject | null>(initialProject || null);
  const [currentConfiguration, setCurrentConfiguration] = useState<WellConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState('project');

  const handleProjectChange = (project: WellProject | null) => {
    setCurrentProject(project);
    if (project) {
      // Convert WellProject to OpenProsperProject format
      const openProsperProject: OpenProsperProject = {
        id: project.id,
        name: project.wellInfo.projectName,
        description: `${project.wellInfo.wellName} - ${project.wellInfo.wellType}`,
        cases: [], // Will be populated by the OpenProsper modules
        created_at: project.createdAt,
        updated_at: project.updatedAt,
        version: '1.0'
      };

      onProjectDataChange({
        wellInfo: project.wellInfo,
        openProsperProject
      });
    } else {
      onProjectDataChange({
        wellInfo: {
          projectName: '',
          wellName: '',
          wellType: 'production',
          unitSystem: 'field'
        },
        openProsperProject: null
      });
    }
  };

  const handleConfigurationChange = (config: WellConfiguration | null) => {
    setCurrentConfiguration(config);
  };

  const handleSaveConfiguration = (configData: Record<string, any>) => {
    // This will be implemented to save current calculation state
    // Saving configuration data
  };

  const handleLoadConfiguration = (configData: Record<string, any>) => {
    // This will be implemented to load calculation state
    // Loading configuration data
  };

  const exportProject = () => {
    if (!currentProject) return;
    
    const exportData = {
      project: currentProject,
      configuration: currentConfiguration,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.wellInfo.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.project) {
          setCurrentProject(data.project);
          setCurrentConfiguration(data.configuration || null);
          handleProjectChange(data.project);
        }
      } catch (err) {
        // Error importing project
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              H2Oil Complete - Project Manager
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-project')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                id="import-project"
                type="file"
                accept=".json"
                onChange={importProject}
                className="hidden"
              />
              {currentProject && (
                <Button variant="outline" size="sm" onClick={exportProject}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentProject ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{currentProject.wellInfo.projectName}</p>
                    <p className="text-xs text-muted-foreground">Project</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{currentProject.wellInfo.wellName}</p>
                    <p className="text-xs text-muted-foreground">Well</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {currentProject.wellInfo.locationName || 'Not specified'}
                    </p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {currentProject.updatedAt.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {currentProject.wellInfo.wellType}
                </Badge>
                <Badge variant="outline">
                  {currentProject.wellInfo.unitSystem} units
                </Badge>
                {currentProject.wellInfo.country && (
                  <Badge variant="outline">
                    <Globe className="h-3 w-3 mr-1" />
                    {currentProject.wellInfo.country}
                  </Badge>
                )}
                {currentProject.wellInfo.totalDepth && (
                  <Badge variant="outline">
                    <Ruler className="h-3 w-3 mr-1" />
                    {currentProject.wellInfo.totalDepth} {currentProject.wellInfo.unitSystem === 'metric' ? 'm' : 'ft'}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No project selected. Create a new project or load an existing one.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Project Info
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="project" className="space-y-6">
          <WellInfoForm
            onProjectChange={handleProjectChange}
            onConfigurationChange={handleConfigurationChange}
            initialProject={currentProject}
            initialConfiguration={currentConfiguration}
          />
        </TabsContent>
        
        <TabsContent value="configurations" className="space-y-6">
          <ConfigurationManager
            currentProject={currentProject}
            currentConfiguration={currentConfiguration}
            onConfigurationChange={handleConfigurationChange}
            onSaveConfiguration={handleSaveConfiguration}
            onLoadConfiguration={handleLoadConfiguration}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
