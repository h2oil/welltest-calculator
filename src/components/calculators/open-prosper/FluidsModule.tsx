import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Droplets, 
  Thermometer, 
  Gauge, 
  Calculator,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { H2OilCompleteEngine } from '@/lib/open-prosper-engine';
import type { Fluid, FluidKind, UnitSystem } from '@/types/open-prosper';

interface FluidsModuleProps {
  fluid: Fluid | undefined;
  unitSystem: UnitSystem;
  onUpdate: (fluid: Fluid) => void;
}

export const FluidsModule: React.FC<FluidsModuleProps> = ({
  fluid,
  unitSystem,
  onUpdate
}) => {
  const [localFluid, setLocalFluid] = useState<Fluid>(fluid || {
    kind: 'oil',
    pvt: {},
    temperature: 80,
    pressure: 2000,
    standardConditions: {
      pressure: 14.7,
      temperature: 60
    }
  });

  const [calculatedProperties, setCalculatedProperties] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (fluid) {
      setLocalFluid(fluid);
    }
  }, [fluid]);

  const handleFluidUpdate = (updates: Partial<Fluid>) => {
    const updatedFluid = { ...localFluid, ...updates };
    setLocalFluid(updatedFluid);
    onUpdate(updatedFluid);
  };

  const handlePVTUpdate = (updates: Partial<Fluid['pvt']>) => {
    const updatedPVT = { ...localFluid.pvt, ...updates };
    handleFluidUpdate({ pvt: updatedPVT });
  };

  const calculatePVTProperties = async () => {
    if (!localFluid) return;

    setIsCalculating(true);
    try {
      const { PVTCalculator } = H2OilCompleteEngine;
      
      // Calculate oil properties if oil well
      if (localFluid.kind === 'oil' || localFluid.kind === 'oil-gas') {
        const oilProps = PVTCalculator.calculateStandingOilProperties(
          localFluid.pressure,
          localFluid.temperature,
          localFluid.pvt.gamma_g || 0.7,
          localFluid.pvt.api_gravity || 35,
          localFluid.pvt.bubble_point_pressure
        );
        
        setCalculatedProperties(prev => ({
          ...prev,
          oil: oilProps
        }));
      }

      // Calculate gas properties if gas well
      if (localFluid.kind === 'gas' || localFluid.kind === 'gas-condensate') {
        const gasProps = PVTCalculator.calculateGasProperties(
          localFluid.pressure,
          localFluid.temperature,
          localFluid.pvt.gamma_g || 0.7,
          localFluid.pvt.MW
        );
        
        setCalculatedProperties(prev => ({
          ...prev,
          gas: gasProps
        }));
      }
    } catch (error) {
      console.error('PVT calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';
  const getTemperatureUnit = () => unitSystem === 'metric' ? '°C' : '°F';
  const getDensityUnit = () => unitSystem === 'metric' ? 'kg/m³' : 'lb/ft³';
  const getViscosityUnit = () => 'cp';
  const getVolumeUnit = () => unitSystem === 'metric' ? 'm³/m³' : 'rb/stb';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Droplets className="h-6 w-6" />
            PVT & Fluids
          </h2>
          <p className="text-muted-foreground">
            Define fluid properties and PVT characteristics
          </p>
        </div>
        <Button onClick={calculatePVTProperties} disabled={isCalculating}>
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Calculating...' : 'Calculate PVT'}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Properties</TabsTrigger>
          <TabsTrigger value="oil">Oil Properties</TabsTrigger>
          <TabsTrigger value="gas">Gas Properties</TabsTrigger>
          <TabsTrigger value="water">Water Properties</TabsTrigger>
        </TabsList>

        {/* Basic Properties */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Basic Fluid Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fluid-kind">Fluid Type</Label>
                  <Select
                    value={localFluid.kind}
                    onValueChange={(value: FluidKind) => handleFluidUpdate({ kind: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oil">Oil</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="oil-gas">Oil-Gas</SelectItem>
                      <SelectItem value="gas-condensate">Gas-Condensate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservoir-temperature">Reservoir Temperature</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reservoir-temperature"
                      type="number"
                      value={localFluid.temperature}
                      onChange={(e) => handleFluidUpdate({ temperature: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getTemperatureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservoir-pressure">Reservoir Pressure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reservoir-pressure"
                      type="number"
                      value={localFluid.pressure}
                      onChange={(e) => handleFluidUpdate({ pressure: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPressureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gor">Gas-Oil Ratio (GOR)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gor"
                      type="number"
                      value={localFluid.gor || 0}
                      onChange={(e) => handleFluidUpdate({ gor: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      scf/stb
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wct">Water Cut (WCT)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wct"
                      type="number"
                      value={localFluid.wct || 0}
                      onChange={(e) => handleFluidUpdate({ wct: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      %
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Standard Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="std-pressure">Standard Pressure</Label>
                    <div className="flex gap-2">
                      <Input
                        id="std-pressure"
                        type="number"
                        value={localFluid.standardConditions.pressure}
                        onChange={(e) => handleFluidUpdate({
                          standardConditions: {
                            ...localFluid.standardConditions,
                            pressure: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                      <Badge variant="outline" className="px-3 py-2">
                        {getPressureUnit()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="std-temperature">Standard Temperature</Label>
                    <div className="flex gap-2">
                      <Input
                        id="std-temperature"
                        type="number"
                        value={localFluid.standardConditions.temperature}
                        onChange={(e) => handleFluidUpdate({
                          standardConditions: {
                            ...localFluid.standardConditions,
                            temperature: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                      <Badge variant="outline" className="px-3 py-2">
                        {getTemperatureUnit()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Oil Properties */}
        <TabsContent value="oil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Oil Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-gravity">API Gravity</Label>
                  <Input
                    id="api-gravity"
                    type="number"
                    value={localFluid.pvt.api_gravity || 0}
                    onChange={(e) => handlePVTUpdate({ api_gravity: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bubble-point">Bubble Point Pressure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bubble-point"
                      type="number"
                      value={localFluid.pvt.bubble_point_pressure || 0}
                      onChange={(e) => handlePVTUpdate({ bubble_point_pressure: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getPressureUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oil-density">Oil Density</Label>
                  <div className="flex gap-2">
                    <Input
                      id="oil-density"
                      type="number"
                      value={localFluid.pvt.rho_o || 0}
                      onChange={(e) => handlePVTUpdate({ rho_o: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getDensityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oil-viscosity">Oil Viscosity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="oil-viscosity"
                      type="number"
                      value={localFluid.pvt.mu_o || 0}
                      onChange={(e) => handlePVTUpdate({ mu_o: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getViscosityUnit()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Calculated Properties */}
              {calculatedProperties?.oil && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Calculated Oil Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Solution GOR (Rs):</span>
                      <span className="ml-2">{calculatedProperties.oil.Rs?.toFixed(2)} scf/stb</span>
                    </div>
                    <div>
                      <span className="font-medium">Oil FVF (Bo):</span>
                      <span className="ml-2">{calculatedProperties.oil.Bo?.toFixed(3)} {getVolumeUnit()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Oil Viscosity (μo):</span>
                      <span className="ml-2">{calculatedProperties.oil.mu_o?.toFixed(2)} cp</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gas Properties */}
        <TabsContent value="gas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Gas Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gas-gravity">Gas Specific Gravity</Label>
                  <Input
                    id="gas-gravity"
                    type="number"
                    step="0.01"
                    value={localFluid.pvt.gamma_g || 0}
                    onChange={(e) => handlePVTUpdate({ gamma_g: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="molecular-weight">Molecular Weight</Label>
                  <Input
                    id="molecular-weight"
                    type="number"
                    value={localFluid.pvt.MW || 0}
                    onChange={(e) => handlePVTUpdate({ MW: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gas-density">Gas Density</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gas-density"
                      type="number"
                      value={localFluid.pvt.rho_g || 0}
                      onChange={(e) => handlePVTUpdate({ rho_g: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getDensityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gas-viscosity">Gas Viscosity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gas-viscosity"
                      type="number"
                      value={localFluid.pvt.mu_g || 0}
                      onChange={(e) => handlePVTUpdate({ mu_g: parseFloat(e.target.value) || 0 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getViscosityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="z-factor">Z-Factor</Label>
                  <Input
                    id="z-factor"
                    type="number"
                    step="0.01"
                    value={localFluid.pvt.Z || 0}
                    onChange={(e) => handlePVTUpdate({ Z: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="k-ratio">k (Cp/Cv)</Label>
                  <Input
                    id="k-ratio"
                    type="number"
                    step="0.01"
                    value={localFluid.pvt.k || 0}
                    onChange={(e) => handlePVTUpdate({ k: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Calculated Properties */}
              {calculatedProperties?.gas && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Calculated Gas Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Z-Factor:</span>
                      <span className="ml-2">{calculatedProperties.gas.Z?.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Gas Density:</span>
                      <span className="ml-2">{calculatedProperties.gas.rho_g?.toFixed(2)} {getDensityUnit()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Gas Viscosity:</span>
                      <span className="ml-2">{calculatedProperties.gas.mu_g?.toFixed(4)} cp</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Water Properties */}
        <TabsContent value="water" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Water Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="water-density">Water Density</Label>
                  <div className="flex gap-2">
                    <Input
                      id="water-density"
                      type="number"
                      value={localFluid.pvt.rho_w || 1000}
                      onChange={(e) => handlePVTUpdate({ rho_w: parseFloat(e.target.value) || 1000 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getDensityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water-viscosity">Water Viscosity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="water-viscosity"
                      type="number"
                      value={localFluid.pvt.mu_w || 1}
                      onChange={(e) => handlePVTUpdate({ mu_w: parseFloat(e.target.value) || 1 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getViscosityUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water-fvf">Water FVF (Bw)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="water-fvf"
                      type="number"
                      step="0.001"
                      value={localFluid.pvt.Bw || 1}
                      onChange={(e) => handlePVTUpdate({ Bw: parseFloat(e.target.value) || 1 })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getVolumeUnit()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
