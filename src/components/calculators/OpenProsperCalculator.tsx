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
      name: 'Typical Oil Well - Permian Basin',
      description: 'Realistic oil well with typical completion design and flow data',
      fluid: {
        kind: 'oil',
        pvt: {
          Rs: 150, // scf/stb - typical for Permian
          Bo: 1.35, // rb/stb
          mu_o: 1.8, // cp
          rho_o: 850, // kg/m³ (35° API)
          rho_g: 0.85, // kg/m³ (0.7 SG)
          mu_g: 0.015 // cp
        },
        gor: 150,
        wct: 5, // 5% water cut
        temperature: 95, // °C (203°F)
        pressure: 3500, // psi
        standardConditions: {
          pressure: 14.7, // psi
          temperature: 60 // °F
        }
      },
      deviation: [
        { md: 0, tvd: 0, inc: 0, azi: 0 },
        { md: 500, tvd: 500, inc: 0, azi: 0 },
        { md: 1000, tvd: 1000, inc: 0, azi: 0 },
        { md: 1500, tvd: 1500, inc: 0, azi: 0 },
        { md: 2000, tvd: 2000, inc: 0, azi: 0 },
        { md: 2500, tvd: 2500, inc: 0, azi: 0 },
        { md: 3000, tvd: 3000, inc: 0, azi: 0 },
        { md: 3500, tvd: 3500, inc: 0, azi: 0 },
        { md: 4000, tvd: 4000, inc: 0, azi: 0 },
        { md: 4500, tvd: 4500, inc: 0, azi: 0 },
        { md: 5000, tvd: 5000, inc: 0, azi: 0 },
        { md: 5500, tvd: 5500, inc: 0, azi: 0 },
        { md: 6000, tvd: 6000, inc: 0, azi: 0 },
        { md: 6500, tvd: 6500, inc: 0, azi: 0 },
        { md: 7000, tvd: 7000, inc: 0, azi: 0 },
        { md: 7500, tvd: 7500, inc: 0, azi: 0 },
        { md: 8000, tvd: 8000, inc: 0, azi: 0 },
        { md: 8500, tvd: 8500, inc: 0, azi: 0 },
        { md: 9000, tvd: 9000, inc: 0, azi: 0 },
        { md: 9500, tvd: 9500, inc: 0, azi: 0 },
        { md: 10000, tvd: 10000, inc: 0, azi: 0 }
      ],
      completion: {
        tubing_id: 0.073, // 2.875" tubing (2.441" ID)
        tubing_roughness: 0.00015, // m
        devices: [
          {
            id: 'sssv-1',
            type: 'sssv',
            md_start: 0,
            md_end: 200, // m
            id_inner: 0.073, // m
            id_outer: 0.073, // m
            roughness: 0.00015,
            properties: { status: 'open' }
          },
          {
            id: 'packer-1',
            type: 'packer',
            md_start: 2800,
            md_end: 2800, // m (9,200 ft)
            id_inner: 0.178, // m (7" casing)
            id_outer: 0.178, // m
            roughness: 0.00015,
            properties: { status: 'set' }
          },
          {
            id: 'ssd-1',
            type: 'ssd',
            md_start: 2900,
            md_end: 2900, // m (9,500 ft)
            id_inner: 0.073, // m
            id_outer: 0.073, // m
            roughness: 0.00015,
            properties: { status: 'open' }
          },
          {
            id: 'ssd-2',
            type: 'ssd',
            md_start: 3000,
            md_end: 3000, // m (9,850 ft)
            id_inner: 0.073, // m
            id_outer: 0.073, // m
            roughness: 0.00015,
            properties: { status: 'open' }
          },
          {
            id: 'ssd-3',
            type: 'ssd',
            md_start: 3100,
            md_end: 3100, // m (10,200 ft)
            id_inner: 0.073, // m
            id_outer: 0.073, // m
            roughness: 0.00015,
            properties: { status: 'open' }
          }
        ],
        perforations: [
          {
            id: 'perf-1',
            md_start: 3200, // m (10,500 ft)
            md_end: 3250, // m (10,650 ft)
            density: 12, // shots/ft
            phasing: 60, // degrees
            diameter: 0.5, // inches
            skin: 2.5,
            crushed_zone_skin: 1.5,
            compaction_skin: 1.0
          },
          {
            id: 'perf-2',
            md_start: 3250, // m (10,650 ft)
            md_end: 3300, // m (10,800 ft)
            density: 12, // shots/ft
            phasing: 60, // degrees
            diameter: 0.5, // inches
            skin: 2.5,
            crushed_zone_skin: 1.5,
            compaction_skin: 1.0
          }
        ],
        packer_depth: 2800, // m (9,200 ft)
        ssd_depths: [2900, 3000, 3100] // m
      },
      ipr: {
        type: 'vogel',
        parameters: {
          reservoir_pressure: 3500, // psi
          skin: 5.0, // total skin including perforation damage
          permeability: 0.5, // md (tight oil)
          thickness: 100, // ft
          drainage_radius: 2000, // ft
          wellbore_radius: 0.25, // ft
          bubble_point_pressure: 1200, // psi
          pi: 0.8 // bbl/d/psi
        }
      },
      vlp: {
        correlation: 'beggs-brill',
        temperature_model: 'simple',
        temperature_gradient: 0.025, // °C/m (1.4°F/100ft)
        roughness_factor: 1.0,
        holdup_tuning: 1.0
      },
      constraints: {
        whp_limit: 500, // psi
        drawdown_max: 1000, // psi
        pwf_min: 500, // psi
        q_max: 2000 // bbl/d
      },
      measured_data: [
        {
          id: 'test-1',
          q_oil: 100, // bbl/d
          q_gas: 15000, // scf/d
          q_water: 5, // bbl/d
          pwf: 3200, // psi
          whp: 450, // psi
          gor: 150, // scf/stb
          wct: 5, // %
          date: new Date('2024-01-15'),
          test_type: 'production'
        },
        {
          id: 'test-2',
          q_oil: 200, // bbl/d
          q_gas: 30000, // scf/d
          q_water: 10, // bbl/d
          pwf: 3000, // psi
          whp: 420, // psi
          gor: 150, // scf/stb
          wct: 5, // %
          date: new Date('2024-01-20'),
          test_type: 'production'
        },
        {
          id: 'test-3',
          q_oil: 300, // bbl/d
          q_gas: 45000, // scf/d
          q_water: 15, // bbl/d
          pwf: 2800, // psi
          whp: 400, // psi
          gor: 150, // scf/stb
          wct: 5, // %
          date: new Date('2024-01-25'),
          test_type: 'production'
        },
        {
          id: 'test-4',
          q_oil: 400, // bbl/d
          q_gas: 60000, // scf/d
          q_water: 20, // bbl/d
          pwf: 2600, // psi
          whp: 380, // psi
          gor: 150, // scf/stb
          wct: 5, // %
          date: new Date('2024-01-30'),
          test_type: 'production'
        },
        {
          id: 'test-5',
          q_oil: 500, // bbl/d
          q_gas: 75000, // scf/d
          q_water: 25, // bbl/d
          pwf: 2400, // psi
          whp: 360, // psi
          gor: 150, // scf/stb
          wct: 5, // %
          date: new Date('2024-02-05'),
          test_type: 'production'
        }
      ],
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
        className="flex h-full"
        orientation="vertical"
      >
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-gray-900 dark:bg-gray-800 border-r border-gray-700 dark:border-gray-700 flex-shrink-0">
          <TabsList className="flex flex-col h-full w-full bg-gray-900 dark:bg-gray-800 p-2 space-y-1">
            <TabsTrigger 
              value="fluids" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('fluids')}
              <span>Fluids</span>
            </TabsTrigger>
            <TabsTrigger 
              value="well" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('well')}
              <span>Well</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completion" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('completion')}
              <span>Completion</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ipr" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('ipr')}
              <span>IPR</span>
            </TabsTrigger>
            <TabsTrigger 
              value="vlp" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('vlp')}
              <span>VLP</span>
            </TabsTrigger>
            <TabsTrigger 
              value="nodal" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('nodal')}
              <span>Nodal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="matching" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('matching')}
              <span>Matching</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sensitivity" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('sensitivity')}
              <span>Sensitivity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-3 justify-start w-full h-12 px-4 text-gray-300 hover:text-white hover:bg-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors"
            >
              {getTabIcon('reports')}
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">

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
        </div>
      </Tabs>
    </div>
  );
};

export default H2OilCompleteCalculator;
