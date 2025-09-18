import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Wrench,
  Target
} from 'lucide-react';

import type { Completion, Device, PerforationInterval, DeviceType, UnitSystem } from '@/types/open-prosper';

interface CompletionModuleProps {
  completion: Completion | undefined;
  unitSystem: UnitSystem;
  onUpdate: (completion: Completion) => void;
}

export const CompletionModule: React.FC<CompletionModuleProps> = ({
  completion,
  unitSystem,
  onUpdate
}) => {
  const [localCompletion, setLocalCompletion] = useState<Completion>(
    completion || {
      tubing_id: 0.0625, // 2.5" tubing
      tubing_roughness: 0.00015, // m
      devices: [],
      perforations: [],
      packer_depth: undefined,
      ssd_depths: []
    }
  );

  const [newDevice, setNewDevice] = useState<Device>({
    id: '',
    type: 'tubing',
    md_start: 0,
    md_end: 0,
    id_inner: 0,
    id_outer: 0,
    roughness: 0,
    properties: {}
  });

  const [newPerforation, setNewPerforation] = useState<PerforationInterval>({
    id: '',
    md_start: 0,
    md_end: 0,
    density: 12,
    phasing: 60,
    diameter: 0.5,
    skin: 0,
    crushed_zone_skin: 0,
    compaction_skin: 0
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (completion) {
      setLocalCompletion(completion);
    }
  }, [completion]);

  const handleCompletionUpdate = (updates: Partial<Completion>) => {
    const updatedCompletion = { ...localCompletion, ...updates };
    setLocalCompletion(updatedCompletion);
    onUpdate(updatedCompletion);
  };

  const addDevice = () => {
    if (!newDevice.id || newDevice.md_start < 0 || newDevice.md_end <= newDevice.md_start) {
      setErrors(['Invalid device data']);
      return;
    }

    const updatedDevices = [...localCompletion.devices, { ...newDevice }];
    handleCompletionUpdate({ devices: updatedDevices });
    setNewDevice({
      id: '',
      type: 'tubing',
      md_start: 0,
      md_end: 0,
      id_inner: 0,
      id_outer: 0,
      roughness: 0,
      properties: {}
    });
    setErrors([]);
  };

  const removeDevice = (index: number) => {
    const updatedDevices = localCompletion.devices.filter((_, i) => i !== index);
    handleCompletionUpdate({ devices: updatedDevices });
  };

  const addPerforation = () => {
    if (!newPerforation.id || newPerforation.md_start < 0 || newPerforation.md_end <= newPerforation.md_start) {
      setErrors(['Invalid perforation data']);
      return;
    }

    const updatedPerforations = [...localCompletion.perforations, { ...newPerforation }];
    handleCompletionUpdate({ perforations: updatedPerforations });
    setNewPerforation({
      id: '',
      md_start: 0,
      md_end: 0,
      density: 12,
      phasing: 60,
      diameter: 0.5,
      skin: 0,
      crushed_zone_skin: 0,
      compaction_skin: 0
    });
    setErrors([]);
  };

  const removePerforation = (index: number) => {
    const updatedPerforations = localCompletion.perforations.filter((_, i) => i !== index);
    handleCompletionUpdate({ perforations: updatedPerforations });
  };

  const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getDiameterUnit = () => unitSystem === 'metric' ? 'm' : 'in';
  const getRoughnessUnit = () => unitSystem === 'metric' ? 'm' : 'ft';
  const getDensityUnit = () => 'shots/ft';
  const getAngleUnit = () => '°';

  const calculateCompletionStats = () => {
    const totalPerforations = localCompletion.perforations.reduce(
      (sum, perf) => sum + (perf.md_end - perf.md_start) * perf.density,
      0
    );
    
    const totalPerforatedLength = localCompletion.perforations.reduce(
      (sum, perf) => sum + (perf.md_end - perf.md_start),
      0
    );

    return { totalPerforations, totalPerforatedLength };
  };

  const stats = calculateCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Completion Modelling
          </h2>
          <p className="text-muted-foreground">
            Define completion geometry, devices, and perforations
          </p>
        </div>
      </div>

      {/* Errors */}
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

      {/* Completion Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{localCompletion.devices.length}</div>
            <p className="text-sm text-muted-foreground">Devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalPerforations.toFixed(0)}</div>
            <p className="text-sm text-muted-foreground">Total Perforations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalPerforatedLength.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Perforated Length ({getLengthUnit()})</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tubing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tubing">Tubing</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="perforations">Perforations</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Tubing Configuration */}
        <TabsContent value="tubing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tubing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tubing-id">Tubing Inner Diameter</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tubing-id"
                      type="number"
                      step="0.001"
                      value={localCompletion.tubing_id}
                      onChange={(e) => handleCompletionUpdate({ 
                        tubing_id: parseFloat(e.target.value) || 0 
                      })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getDiameterUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tubing-roughness">Tubing Roughness</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tubing-roughness"
                      type="number"
                      step="0.00001"
                      value={localCompletion.tubing_roughness}
                      onChange={(e) => handleCompletionUpdate({ 
                        tubing_roughness: parseFloat(e.target.value) || 0 
                      })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getRoughnessUnit()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packer-depth">Packer Depth</Label>
                  <div className="flex gap-2">
                    <Input
                      id="packer-depth"
                      type="number"
                      value={localCompletion.packer_depth || 0}
                      onChange={(e) => handleCompletionUpdate({ 
                        packer_depth: parseFloat(e.target.value) || undefined 
                      })}
                    />
                    <Badge variant="outline" className="px-3 py-2">
                      {getLengthUnit()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Completion Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>MD Start ({getLengthUnit()})</TableHead>
                    <TableHead>MD End ({getLengthUnit()})</TableHead>
                    <TableHead>ID Inner ({getDiameterUnit()})</TableHead>
                    <TableHead>ID Outer ({getDiameterUnit()})</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localCompletion.devices.map((device, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{device.type}</TableCell>
                      <TableCell>{device.md_start}</TableCell>
                      <TableCell>{device.md_end}</TableCell>
                      <TableCell>{device.id_inner}</TableCell>
                      <TableCell>{device.id_outer}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDevice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Add New Device */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-type">Device Type</Label>
                    <Select
                      value={newDevice.type}
                      onValueChange={(value: DeviceType) => setNewDevice(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tubing">Tubing</SelectItem>
                        <SelectItem value="casing">Casing</SelectItem>
                        <SelectItem value="liner">Liner</SelectItem>
                        <SelectItem value="sssv">SSSV</SelectItem>
                        <SelectItem value="packer">Packer</SelectItem>
                        <SelectItem value="ssd">SSD</SelectItem>
                        <SelectItem value="icd">ICD</SelectItem>
                        <SelectItem value="icv">ICV</SelectItem>
                        <SelectItem value="gravel-pack">Gravel Pack</SelectItem>
                        <SelectItem value="screen">Screen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-id">Device ID</Label>
                    <Input
                      id="device-id"
                      value={newDevice.id}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="Device identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-md-start">MD Start</Label>
                    <Input
                      id="device-md-start"
                      type="number"
                      value={newDevice.md_start}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, md_start: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-md-end">MD End</Label>
                    <Input
                      id="device-md-end"
                      type="number"
                      value={newDevice.md_end}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, md_end: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-id-inner">ID Inner</Label>
                    <Input
                      id="device-id-inner"
                      type="number"
                      step="0.001"
                      value={newDevice.id_inner}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, id_inner: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-id-outer">ID Outer</Label>
                    <Input
                      id="device-id-outer"
                      type="number"
                      step="0.001"
                      value={newDevice.id_outer}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, id_outer: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-roughness">Roughness</Label>
                    <Input
                      id="device-roughness"
                      type="number"
                      step="0.00001"
                      value={newDevice.roughness}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, roughness: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={addDevice} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Device
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perforations */}
        <TabsContent value="perforations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Perforation Intervals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>MD Start ({getLengthUnit()})</TableHead>
                    <TableHead>MD End ({getLengthUnit()})</TableHead>
                    <TableHead>Density ({getDensityUnit()})</TableHead>
                    <TableHead>Phasing ({getAngleUnit()})</TableHead>
                    <TableHead>Diameter (in)</TableHead>
                    <TableHead>Skin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localCompletion.perforations.map((perf, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{perf.id}</TableCell>
                      <TableCell>{perf.md_start}</TableCell>
                      <TableCell>{perf.md_end}</TableCell>
                      <TableCell>{perf.density}</TableCell>
                      <TableCell>{perf.phasing}</TableCell>
                      <TableCell>{perf.diameter}</TableCell>
                      <TableCell>{perf.skin}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePerforation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Add New Perforation */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="perf-id">Perforation ID</Label>
                    <Input
                      id="perf-id"
                      value={newPerforation.id}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="Perforation identifier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-md-start">MD Start</Label>
                    <Input
                      id="perf-md-start"
                      type="number"
                      value={newPerforation.md_start}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, md_start: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-md-end">MD End</Label>
                    <Input
                      id="perf-md-end"
                      type="number"
                      value={newPerforation.md_end}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, md_end: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-density">Density</Label>
                    <Input
                      id="perf-density"
                      type="number"
                      value={newPerforation.density}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, density: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-phasing">Phasing</Label>
                    <Input
                      id="perf-phasing"
                      type="number"
                      value={newPerforation.phasing}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, phasing: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-diameter">Diameter</Label>
                    <Input
                      id="perf-diameter"
                      type="number"
                      step="0.1"
                      value={newPerforation.diameter}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, diameter: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-skin">Skin</Label>
                    <Input
                      id="perf-skin"
                      type="number"
                      value={newPerforation.skin}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, skin: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-crushed-skin">Crushed Zone Skin</Label>
                    <Input
                      id="perf-crushed-skin"
                      type="number"
                      value={newPerforation.crushed_zone_skin}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, crushed_zone_skin: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perf-compaction-skin">Compaction Skin</Label>
                    <Input
                      id="perf-compaction-skin"
                      type="number"
                      value={newPerforation.compaction_skin}
                      onChange={(e) => setNewPerforation(prev => ({ ...prev, compaction_skin: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={addPerforation} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Perforation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Tubing Configuration</h3>
                  <div className="space-y-1 text-sm">
                    <div>Inner Diameter: {localCompletion.tubing_id} {getDiameterUnit()}</div>
                    <div>Roughness: {localCompletion.tubing_roughness} {getRoughnessUnit()}</div>
                    <div>Packer Depth: {localCompletion.packer_depth || 'Not set'} {getLengthUnit()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Devices ({localCompletion.devices.length})</h3>
                  <div className="space-y-1 text-sm">
                    {localCompletion.devices.map((device, index) => (
                      <div key={index}>
                        {device.type}: {device.md_start}-{device.md_end} {getLengthUnit()}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Perforations ({localCompletion.perforations.length})</h3>
                  <div className="space-y-1 text-sm">
                    {localCompletion.perforations.map((perf, index) => (
                      <div key={index}>
                        {perf.id}: {perf.md_start}-{perf.md_end} {getLengthUnit()}, 
                        {perf.density} {getDensityUnit()}, {perf.phasing}°
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <div>Total Perforations: {stats.totalPerforations.toFixed(0)}</div>
                    <div>Perforated Length: {stats.totalPerforatedLength.toFixed(1)} {getLengthUnit()}</div>
                    <div>Average Density: {stats.totalPerforatedLength > 0 ? (stats.totalPerforations / stats.totalPerforatedLength).toFixed(1) : 0} {getDensityUnit()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Status */}
      {errors.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Completion configuration is valid
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
