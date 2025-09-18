import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';

import type { NodalResult, UnitSystem } from '@/types/open-prosper';

interface NodalModuleProps {
  nodalResult: NodalResult | null;
  isCalculating: boolean;
  onRecalculate: () => void;
  unitSystem: UnitSystem;
}

export const NodalModule: React.FC<NodalModuleProps> = ({
  nodalResult,
  isCalculating,
  onRecalculate,
  unitSystem
}) => {
  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Nodal Analysis & Operating Point
          </h2>
          <p className="text-muted-foreground">
            IPR×VLP intersection and operating point analysis
          </p>
        </div>
        <Button onClick={onRecalculate} disabled={isCalculating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Calculating...' : 'Recalculate'}
        </Button>
      </div>

      {/* Operating Point Results */}
      {nodalResult ? (
        <div className="space-y-6">
          {/* Operating Point Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Operating Point
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {nodalResult.operating_point?.rate?.toFixed(1) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-blue-700">Flow Rate ({getFlowRateUnit()})</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {nodalResult.operating_point?.pwf?.toFixed(0) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-green-700">Bottomhole Pressure ({getPressureUnit()})</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {nodalResult.operating_point?.whp?.toFixed(0) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-purple-700">Wellhead Pressure ({getPressureUnit()})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Convergence Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Convergence Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${nodalResult.convergence ? 'text-green-600' : 'text-red-600'}`}>
                  {nodalResult.convergence ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {nodalResult.convergence ? 'Converged' : 'Not Converged'}
                  </span>
                </div>
                <Badge variant="outline">
                  {nodalResult.iterations} iterations
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {nodalResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Warnings:</p>
                  <ul className="list-disc list-inside">
                    {nodalResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* IPR Curve Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                IPR Curve Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.ipr_curve?.max_rate?.toFixed(1) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Max Rate ({getFlowRateUnit()})</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.ipr_curve?.max_pressure?.toFixed(0) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Max Pressure ({getPressureUnit()})</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.ipr_curve?.rates?.length ?? 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VLP Curve Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                VLP Curve Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.vlp_curve?.max_rate?.toFixed(1) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Max Rate ({getFlowRateUnit()})</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.vlp_curve?.max_pressure?.toFixed(0) ?? 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Max Pressure ({getPressureUnit()})</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {nodalResult.vlp_curve?.rates?.length ?? 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Flow Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Operating Rate:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.rate?.toFixed(1) ?? 'N/A'} {getFlowRateUnit()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>IPR Max Rate:</span>
                      <span className="font-medium">
                        {nodalResult.ipr_curve?.max_rate?.toFixed(1) ?? 'N/A'} {getFlowRateUnit()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>VLP Max Rate:</span>
                      <span className="font-medium">
                        {nodalResult.vlp_curve?.max_rate?.toFixed(1) ?? 'N/A'} {getFlowRateUnit()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Utilization:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.rate && nodalResult.ipr_curve?.max_rate 
                          ? ((nodalResult.operating_point.rate / nodalResult.ipr_curve.max_rate) * 100).toFixed(1) + '%'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Pressure Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Operating BHP:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.pwf?.toFixed(0) ?? 'N/A'} {getPressureUnit()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating WHP:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.whp?.toFixed(0) ?? 'N/A'} {getPressureUnit()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure Drop:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.pwf && nodalResult.operating_point?.whp
                          ? (nodalResult.operating_point.pwf - nodalResult.operating_point.whp).toFixed(0) + ' ' + getPressureUnit()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pressure Ratio:</span>
                      <span className="font-medium">
                        {nodalResult.operating_point?.whp && nodalResult.operating_point?.pwf
                          ? (nodalResult.operating_point.whp / nodalResult.operating_point.pwf).toFixed(3)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Nodal Analysis Results</h3>
          <p className="text-muted-foreground mb-4">
            Complete the IPR and VLP calculations to perform nodal analysis
          </p>
          <Button onClick={onRecalculate} disabled={isCalculating}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Nodal Analysis
          </Button>
        </div>
      )}

      {/* Status */}
      {nodalResult && nodalResult.convergence && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Nodal analysis completed successfully. Operating point found at {nodalResult.operating_point?.rate?.toFixed(1) ?? 'N/A'} {getFlowRateUnit()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
