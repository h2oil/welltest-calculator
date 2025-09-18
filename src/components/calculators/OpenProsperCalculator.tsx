import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  Zap, 
  BarChart3, 
  Settings, 
  Target, 
  TrendingUp, 
  FileText,
  Download,
  Upload,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { H2OilCompleteEngine } from '@/lib/open-prosper-engine';
import type { 
  OpenProsperCase, 
  OpenProsperProject, 
  OpenProsperUIState, 
  UnitSystem,
  Fluid,
  IPRModel,
  VLPSettings,
  Completion,
  DeviationSurvey,
  NodalResult
} from '@/types/open-prosper';

// Import sub-components (to be created)
import { FluidsModule } from './open-prosper/FluidsModule';
import { WellModule } from './open-prosper/WellModule';
import { CompletionModule } from './open-prosper/CompletionModule';
import { IPRModule } from './open-prosper/IPRModule';
import { VLPModule } from './open-prosper/VLPModule';
import { NodalModule } from './open-prosper/NodalModule';
import { MatchingModule } from './open-prosper/MatchingModule';
import { SensitivityModule } from './open-prosper/SensitivityModule';
import { ReportsModule } from './open-prosper/ReportsModule';

interface H2OilCompleteCalculatorProps {
  unitSystem: UnitSystem;
}

const H2OilCompleteCalculator: React.FC<H2OilCompleteCalculatorProps> = ({ unitSystem }) => {
  // State management
  const [project, setProject] = useState<OpenProsperProject>({
    id: 'default-project',
    name: 'H2Oil COMPLETE Project',
    description: 'Single-well performance analysis project',
    cases: [],
    created_at: new Date(),
    updated_at: new Date(),
    version: '1.0.0'
  });

  const [currentCase, setCurrentCase] = useState<OpenProsperCase | null>(null);
  const [uiState, setUIState] = useState<OpenProsperUIState>({
    active_tab: 'fluids',
    selected_case_id: undefined,
    unit_system: unitSystem,
    dark_mode: true,
    show_grid: true,
    show_labels: true
  });

  const [nodalResult, setNodalResult] = useState<NodalResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Create default case if none exists
  useEffect(() => {
    if (project.cases.length === 0) {
      const defaultCase = createDefaultCase();
      setProject(prev => ({
        ...prev,
        cases: [defaultCase]
      }));
      setCurrentCase(defaultCase);
    }
  }, [project.cases.length]);

  // Update unit system when prop changes
  useEffect(() => {
    setUIState(prev => ({
      ...prev,
      unit_system: unitSystem
    }));
  }, [unitSystem]);

  // Perform nodal analysis when case changes
  useEffect(() => {
    if (currentCase) {
      performNodalAnalysis();
    }
  }, [currentCase]);

  const createDefaultCase = (): OpenProsperCase => {
    return {
      id: 'case-1',
      name: 'Default Well Case',
      description: 'Default single-well performance analysis case',
      fluid: {
        kind: 'oil',
        pvt: {
          Rs: 50, // scf/stb
          Bo: 1.2, // rb/stb
          mu_o: 2.0, // cp
          rho_o: 800, // kg/m³
          rho_g: 1.2, // kg/m³
          mu_g: 0.02 // cp
        },
        gor: 50,
        wct: 0,
        temperature: 80, // °C
        pressure: 2000, // psi
        standardConditions: {
          pressure: 14.7, // psi
          temperature: 60 // °F
        }
      },
      deviation: [
        { md: 0, tvd: 0, inc: 0, azi: 0 },
        { md: 1000, tvd: 1000, inc: 0, azi: 0 },
        { md: 2000, tvd: 2000, inc: 0, azi: 0 }
      ],
      completion: {
        tubing_id: 0.0625, // 2.5" tubing
        tubing_roughness: 0.00015, // m
        devices: [],
        perforations: [{
          id: 'perf-1',
          md_start: 1950,
          md_end: 2000,
          density: 12, // shots/ft
          phasing: 60, // degrees
          diameter: 0.5, // inches
          skin: 0,
          crushed_zone_skin: 0,
          compaction_skin: 0
        }],
        packer_depth: 1950,
        ssd_depths: []
      },
      ipr: {
        type: 'vogel',
        parameters: {
          reservoir_pressure: 2000, // psi
          skin: 0,
          permeability: 100, // md
          thickness: 50, // ft
          drainage_radius: 1000, // ft
          wellbore_radius: 0.25, // ft
          bubble_point_pressure: 1000, // psi
          pi: 1.0 // bbl/d/psi
        }
      },
      vlp: {
        correlation: 'beggs-brill',
        temperature_model: 'simple',
        temperature_gradient: 0.02, // °C/m
        roughness_factor: 1.0,
        holdup_tuning: 1.0
      },
      created_at: new Date(),
      updated_at: new Date()
    };
  };

  const performNodalAnalysis = async () => {
    if (!currentCase) return;

    setIsCalculating(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Validate case first
      const validation = H2OilCompleteEngine.Validator.validateCase(currentCase);
      
      if (!validation.valid) {
        setErrors(validation.errors.map(e => e.message));
        setWarnings(validation.warnings);
        return;
      }

      // Perform nodal analysis
      const result = H2OilCompleteEngine.NodalAnalyzer.performNodalAnalysis(
        currentCase.ipr,
        currentCase.vlp,
        currentCase.fluid,
        currentCase.deviation,
        currentCase.completion,
        currentCase.constraints,
        uiState.unit_system
      );

      setNodalResult(result);
      setWarnings(result.warnings);
    } catch (error) {
      setErrors([`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsCalculating(false);
    }
  };

  const updateCase = (updates: Partial<OpenProsperCase>) => {
    if (!currentCase) return;

    const updatedCase = {
      ...currentCase,
      ...updates,
      updated_at: new Date()
    };

    setCurrentCase(updatedCase);
    
    setProject(prev => ({
      ...prev,
      cases: prev.cases.map(c => c.id === updatedCase.id ? updatedCase : c),
      updated_at: new Date()
    }));
  };

  const exportProject = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProject = JSON.parse(e.target?.result as string);
        setProject(importedProject);
        if (importedProject.cases.length > 0) {
          setCurrentCase(importedProject.cases[0]);
        }
      } catch (error) {
        setErrors(['Failed to import project file']);
      }
    };
    reader.readAsText(file);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'fluids': return <Droplets className="h-4 w-4" />;
      case 'well': return <BarChart3 className="h-4 w-4" />;
      case 'completion': return <Settings className="h-4 w-4" />;
      case 'ipr': return <Zap className="h-4 w-4" />;
      case 'vlp': return <TrendingUp className="h-4 w-4" />;
      case 'nodal': return <Target className="h-4 w-4" />;
      case 'matching': return <BarChart3 className="h-4 w-4" />;
      case 'sensitivity': return <TrendingUp className="h-4 w-4" />;
      case 'reports': return <FileText className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">H2Oil COMPLETE</h1>
          <p className="text-muted-foreground">
            Completion & Well Modelling (IPR×VLP, Visual)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            v1.0.0
          </Badge>
          <Button variant="outline" size="sm" onClick={exportProject}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importProject}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Status and Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs 
        value={uiState.active_tab} 
        onValueChange={(value) => setUIState(prev => ({ ...prev, active_tab: value as any }))}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="fluids" className="flex items-center gap-2">
            {getTabIcon('fluids')}
            <span className="hidden sm:inline">Fluids</span>
          </TabsTrigger>
          <TabsTrigger value="well" className="flex items-center gap-2">
            {getTabIcon('well')}
            <span className="hidden sm:inline">Well</span>
          </TabsTrigger>
          <TabsTrigger value="completion" className="flex items-center gap-2">
            {getTabIcon('completion')}
            <span className="hidden sm:inline">Completion</span>
          </TabsTrigger>
          <TabsTrigger value="ipr" className="flex items-center gap-2">
            {getTabIcon('ipr')}
            <span className="hidden sm:inline">IPR</span>
          </TabsTrigger>
          <TabsTrigger value="vlp" className="flex items-center gap-2">
            {getTabIcon('vlp')}
            <span className="hidden sm:inline">VLP</span>
          </TabsTrigger>
          <TabsTrigger value="nodal" className="flex items-center gap-2">
            {getTabIcon('nodal')}
            <span className="hidden sm:inline">Nodal</span>
          </TabsTrigger>
          <TabsTrigger value="matching" className="flex items-center gap-2">
            {getTabIcon('matching')}
            <span className="hidden sm:inline">Matching</span>
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="flex items-center gap-2">
            {getTabIcon('sensitivity')}
            <span className="hidden sm:inline">Sensitivity</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            {getTabIcon('reports')}
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="fluids" className="space-y-4">
          <FluidsModule
            fluid={currentCase?.fluid}
            unitSystem={uiState.unit_system}
            onUpdate={(fluid) => updateCase({ fluid })}
          />
        </TabsContent>

        <TabsContent value="well" className="space-y-4">
          <WellModule
            deviation={currentCase?.deviation}
            unitSystem={uiState.unit_system}
            onUpdate={(deviation) => updateCase({ deviation })}
          />
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <CompletionModule
            completion={currentCase?.completion}
            unitSystem={uiState.unit_system}
            onUpdate={(completion) => updateCase({ completion })}
          />
        </TabsContent>

        <TabsContent value="ipr" className="space-y-4">
          <IPRModule
            ipr={currentCase?.ipr}
            fluid={currentCase?.fluid}
            unitSystem={uiState.unit_system}
            onUpdate={(ipr) => updateCase({ ipr })}
          />
        </TabsContent>

        <TabsContent value="vlp" className="space-y-4">
          <VLPModule
            vlp={currentCase?.vlp}
            fluid={currentCase?.fluid}
            deviation={currentCase?.deviation}
            completion={currentCase?.completion}
            unitSystem={uiState.unit_system}
            onUpdate={(vlp) => updateCase({ vlp })}
          />
        </TabsContent>

        <TabsContent value="nodal" className="space-y-4">
          <NodalModule
            nodalResult={nodalResult}
            isCalculating={isCalculating}
            onRecalculate={performNodalAnalysis}
            unitSystem={uiState.unit_system}
          />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <MatchingModule
            testPoints={currentCase?.test_points || []}
            vlp={currentCase?.vlp}
            fluid={currentCase?.fluid}
            deviation={currentCase?.deviation}
            completion={currentCase?.completion}
            unitSystem={uiState.unit_system}
            onUpdate={(testPoints) => updateCase({ test_points: testPoints })}
          />
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          <SensitivityModule
            case_={currentCase}
            nodalResult={nodalResult}
            unitSystem={uiState.unit_system}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsModule
            case_={currentCase}
            nodalResult={nodalResult}
            project={project}
            unitSystem={uiState.unit_system}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default H2OilCompleteCalculator;
