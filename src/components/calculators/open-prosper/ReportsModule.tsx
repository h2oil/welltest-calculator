import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download,
  CheckCircle,
  BarChart3,
  Settings,
  Target,
  TrendingUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { 
  OpenProsperCase, 
  NodalResult, 
  OpenProsperProject, 
  UnitSystem 
} from '@/types/open-prosper';

interface ReportsModuleProps {
  case_: OpenProsperCase | null;
  nodalResult: NodalResult | null;
  project: OpenProsperProject;
  unitSystem: UnitSystem;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  case_,
  nodalResult,
  project,
  unitSystem
}) => {
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (format: string) => {
    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create report content
      const reportContent = generateReportContent();
      
      // Download report
      if (format === 'pdf') {
        await generatePDF(reportContent);
      } else {
        downloadReport(reportContent, format);
      }
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportContent = () => {
    if (!case_ || !nodalResult) {
      return 'No data available for report generation';
    }

    const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
    const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';
    const getLengthUnit = () => unitSystem === 'metric' ? 'm' : 'ft';

    return `
OPEN-PROSPER Well Performance Report
=====================================

Project: ${project.name}
Case: ${case_.name}
Generated: ${new Date().toLocaleString()}
Unit System: ${unitSystem === 'metric' ? 'Metric' : 'Field'}

WELL SUMMARY
============
Well Type: ${case_.fluid.kind}
Reservoir Pressure: ${Number(case_.ipr.parameters.reservoir_pressure?.toFixed(0)) || 0} ${getPressureUnit()}
Reservoir Temperature: ${Number(case_.fluid.temperature?.toFixed(1)) || 0}°C
Tubing ID: ${Number(case_.completion.tubing_id?.toFixed(3)) || 0} ${getLengthUnit()}
Total Depth: ${Number(Math.max(...case_.deviation.map(d => d.md))?.toFixed(0)) || 0} ${getLengthUnit()}

OPERATING POINT
===============
Flow Rate: ${nodalResult.operating_point?.rate ? Number(nodalResult.operating_point.rate.toFixed(1)) : 'N/A'} ${getFlowRateUnit()}
Bottomhole Pressure: ${nodalResult.operating_point?.pwf ? Number(nodalResult.operating_point.pwf.toFixed(0)) : 'N/A'} ${getPressureUnit()}
Wellhead Pressure: ${nodalResult.operating_point?.whp ? Number(nodalResult.operating_point.whp.toFixed(0)) : 'N/A'} ${getPressureUnit()}
Convergence: ${nodalResult.convergence ? 'Yes' : 'No'}
Iterations: ${nodalResult.iterations}

IPR CURVE
=========
Model: ${case_.ipr.type}
Max Rate: ${nodalResult.ipr_curve?.max_rate?.toFixed(1) ?? 'N/A'} ${getFlowRateUnit()}
Max Pressure: ${nodalResult.ipr_curve?.max_pressure?.toFixed(0) ?? 'N/A'} ${getPressureUnit()}
Data Points: ${nodalResult.ipr_curve.rates.length}

VLP CURVE
=========
Correlation: ${case_.vlp.correlation}
Max Rate: ${nodalResult.vlp_curve?.max_rate?.toFixed(1) ?? 'N/A'} ${getFlowRateUnit()}
Max Pressure: ${nodalResult.vlp_curve?.max_pressure?.toFixed(0) ?? 'N/A'} ${getPressureUnit()}
Data Points: ${nodalResult.vlp_curve.rates.length}

COMPLETION DETAILS
==================
Tubing ID: ${case_.completion.tubing_id.toFixed(3)} ${getLengthUnit()}
Tubing Roughness: ${case_.completion.tubing_roughness.toFixed(5)} ${getLengthUnit()}
Packer Depth: ${case_.completion.packer_depth?.toFixed(0) || 'Not set'} ${getLengthUnit()}
Perforations: ${case_.completion.perforations.length}
Devices: ${case_.completion.devices.length}

FLUID PROPERTIES
================
Fluid Type: ${case_.fluid.kind}
GOR: ${case_.fluid.gor || 0} scf/stb
WCT: ${case_.fluid.wct || 0}%
Oil Density: ${case_.fluid.pvt.rho_o || 0} kg/m³
Gas Density: ${case_.fluid.pvt.rho_g || 0} kg/m³
Oil Viscosity: ${case_.fluid.pvt.mu_o || 0} cp
Gas Viscosity: ${case_.fluid.pvt.mu_g || 0} cp

WARNINGS
========
${nodalResult.warnings.length > 0 ? nodalResult.warnings.join('\n') : 'None'}

END OF REPORT
=============
    `.trim();
  };

  const downloadReport = (content: string, format: string) => {
    if (format === 'pdf') {
      generatePDF(content);
    } else {
      const mimeType = format === 'html' ? 'text/html' : 'text/plain';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `h2oil-complete-report-${case_?.name || 'case'}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const generatePDF = async (content: string) => {
    if (!case_ || !nodalResult) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 20;

    // Helper function to add text with page breaks
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * lineHeight + 5;
    };

    // Header
    addText('H2Oil COMPLETE - Well Performance Report', 16, true);
    addText('==========================================', 12);
    addText('', 10);
    
    // Project Info
    addText('PROJECT INFORMATION', 12, true);
    addText(`Project: ${project.name}`, 10);
    addText(`Case: ${case_.name}`, 10);
    addText(`Generated: ${new Date().toLocaleString()}`, 10);
    addText(`Unit System: ${unitSystem === 'metric' ? 'Metric' : 'Field'}`, 10);
    addText('', 10);

    // Well Summary
    addText('WELL SUMMARY', 12, true);
    addText(`Well Type: ${case_.fluid.kind}`, 10);
    addText(`Reservoir Pressure: ${case_.ipr.parameters.reservoir_pressure.toFixed(0)} ${unitSystem === 'metric' ? 'kPa' : 'psi'}`, 10);
    addText(`Reservoir Temperature: ${case_.fluid.temperature.toFixed(1)}°C`, 10);
    addText(`Tubing ID: ${case_.completion.tubing_id.toFixed(3)} ${unitSystem === 'metric' ? 'm' : 'in'}`, 10);
    addText(`Total Depth: ${Math.max(...case_.deviation.map(d => d.md)).toFixed(0)} ${unitSystem === 'metric' ? 'm' : 'ft'}`, 10);
    addText('', 10);

    // Operating Point
    addText('OPERATING POINT', 12, true);
    addText(`Flow Rate: ${nodalResult.operating_point?.rate?.toFixed(1) ?? 'N/A'} ${unitSystem === 'metric' ? 'm³/d' : 'bbl/d'}`, 10);
    addText(`Bottomhole Pressure: ${nodalResult.operating_point?.pwf?.toFixed(0) ?? 'N/A'} ${unitSystem === 'metric' ? 'kPa' : 'psi'}`, 10);
    addText(`Wellhead Pressure: ${nodalResult.operating_point?.whp?.toFixed(0) ?? 'N/A'} ${unitSystem === 'metric' ? 'kPa' : 'psi'}`, 10);
    addText(`Convergence: ${nodalResult.convergence ? 'Yes' : 'No'}`, 10);
    addText(`Iterations: ${nodalResult.iterations}`, 10);
    addText('', 10);

    // IPR Curve
    addText('IPR CURVE', 12, true);
    addText(`Model: ${case_.ipr.type}`, 10);
    addText(`Max Rate: ${nodalResult.ipr_curve?.max_rate?.toFixed(1) ?? 'N/A'} ${unitSystem === 'metric' ? 'm³/d' : 'bbl/d'}`, 10);
    addText(`Max Pressure: ${nodalResult.ipr_curve?.max_pressure?.toFixed(0) ?? 'N/A'} ${unitSystem === 'metric' ? 'kPa' : 'psi'}`, 10);
    addText(`Data Points: ${nodalResult.ipr_curve.rates.length}`, 10);
    addText('', 10);

    // VLP Curve
    addText('VLP CURVE', 12, true);
    addText(`Correlation: ${case_.vlp.correlation}`, 10);
    addText(`Max Rate: ${nodalResult.vlp_curve?.max_rate?.toFixed(1) ?? 'N/A'} ${unitSystem === 'metric' ? 'm³/d' : 'bbl/d'}`, 10);
    addText(`Max Pressure: ${nodalResult.vlp_curve?.max_pressure?.toFixed(0) ?? 'N/A'} ${unitSystem === 'metric' ? 'kPa' : 'psi'}`, 10);
    addText(`Data Points: ${nodalResult.vlp_curve.rates.length}`, 10);
    addText('', 10);

    // Completion Details
    addText('COMPLETION DETAILS', 12, true);
    addText(`Tubing ID: ${case_.completion.tubing_id.toFixed(3)} ${unitSystem === 'metric' ? 'm' : 'in'}`, 10);
    addText(`Tubing Roughness: ${case_.completion.tubing_roughness.toFixed(5)} ${unitSystem === 'metric' ? 'm' : 'in'}`, 10);
    addText(`Packer Depth: ${case_.completion.packer_depth?.toFixed(0) || 'Not set'} ${unitSystem === 'metric' ? 'm' : 'ft'}`, 10);
    addText(`Perforations: ${case_.completion.perforations.length}`, 10);
    addText(`Devices: ${case_.completion.devices.length}`, 10);
    addText('', 10);

    // Fluid Properties
    addText('FLUID PROPERTIES', 12, true);
    addText(`Fluid Type: ${case_.fluid.kind}`, 10);
    addText(`GOR: ${case_.fluid.gor || 0} scf/stb`, 10);
    addText(`WCT: ${case_.fluid.wct || 0}%`, 10);
    addText(`Oil Density: ${case_.fluid.pvt.rho_o || 0} kg/m³`, 10);
    addText(`Gas Density: ${case_.fluid.pvt.rho_g || 0} kg/m³`, 10);
    addText(`Oil Viscosity: ${case_.fluid.pvt.mu_o || 0} cp`, 10);
    addText(`Gas Viscosity: ${case_.fluid.pvt.mu_g || 0} cp`, 10);
    addText('', 10);

    // Warnings
    if (nodalResult.warnings.length > 0) {
      addText('WARNINGS', 12, true);
      nodalResult.warnings.forEach(warning => {
        addText(`• ${warning}`, 10);
      });
      addText('', 10);
    }

    // Add IPR/VLP Curve Data Tables
    addText('', 10);
    addText('IPR CURVE DATA', 12, true);
    addText('Rate (bbl/d) | Pressure (psi)', 10, true);
    addText('------------------------------', 10);
    
    // Show first 10 data points of IPR curve
    const iprDataPoints = Math.min(10, nodalResult.ipr_curve.rates.length);
    for (let i = 0; i < iprDataPoints; i++) {
      const rate = nodalResult.ipr_curve?.rates?.[i]?.toFixed(1) ?? '0.0';
      const pressure = nodalResult.ipr_curve?.pressures?.[i]?.toFixed(0) ?? '0';
      addText(`${rate.padStart(8)} | ${pressure.padStart(8)}`, 9);
    }
    
    if (nodalResult.ipr_curve.rates.length > 10) {
      addText(`... and ${nodalResult.ipr_curve.rates.length - 10} more points`, 9);
    }

    addText('', 10);
    addText('VLP CURVE DATA', 12, true);
    addText('Rate (bbl/d) | Pressure (psi)', 10, true);
    addText('------------------------------', 10);
    
    // Show first 10 data points of VLP curve
    const vlpDataPoints = Math.min(10, nodalResult.vlp_curve.rates.length);
    for (let i = 0; i < vlpDataPoints; i++) {
      const rate = nodalResult.vlp_curve?.rates?.[i]?.toFixed(1) ?? '0.0';
      const pressure = nodalResult.vlp_curve?.pressures?.[i]?.toFixed(0) ?? '0';
      addText(`${rate.padStart(8)} | ${pressure.padStart(8)}`, 9);
    }
    
    if (nodalResult.vlp_curve.rates.length > 10) {
      addText(`... and ${nodalResult.vlp_curve.rates.length - 10} more points`, 9);
    }

    // Footer
    addText('', 10);
    addText('END OF REPORT', 12, true);
    addText('Generated by H2Oil COMPLETE - Professional Well Modelling Suite', 8);

    // Download the PDF
    doc.save(`h2oil-complete-report-${case_.name}.pdf`);
  };

  const exportData = (format: string) => {
    if (!case_ || !nodalResult) return;

    let content: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify({
        project,
        case: case_,
        nodalResult,
        generatedAt: new Date().toISOString()
      }, null, 2);
      filename = `open-prosper-data-${case_.name}.json`;
    } else if (format === 'csv') {
      // Export operating point data as CSV
      content = `Parameter,Value,Unit
Flow Rate,${nodalResult.operating_point.rate},${unitSystem === 'metric' ? 'm3/d' : 'bbl/d'}
Bottomhole Pressure,${nodalResult.operating_point.pwf},${unitSystem === 'metric' ? 'kPa' : 'psi'}
Wellhead Pressure,${nodalResult.operating_point.whp},${unitSystem === 'metric' ? 'kPa' : 'psi'}
Reservoir Pressure,${case_.ipr.parameters.reservoir_pressure},${unitSystem === 'metric' ? 'kPa' : 'psi'}
Tubing ID,${case_.completion.tubing_id},${unitSystem === 'metric' ? 'm' : 'in'}
Skin Factor,${case_.ipr.parameters.skin},dimensionless
Permeability,${case_.ipr.parameters.permeability},md
Formation Thickness,${case_.ipr.parameters.thickness},${unitSystem === 'metric' ? 'm' : 'ft'}`;
      filename = `open-prosper-data-${case_.name}.csv`;
    } else {
      content = generateReportContent();
      filename = `open-prosper-report-${case_.name}.txt`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFlowRateUnit = () => unitSystem === 'metric' ? 'm³/d' : 'bbl/d';
  const getPressureUnit = () => unitSystem === 'metric' ? 'kPa' : 'psi';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Reports & Export
          </h2>
          <p className="text-muted-foreground">
            Generate reports and export data in various formats
          </p>
        </div>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Format</label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report (Professional)</SelectItem>
                  <SelectItem value="txt">Text Report</SelectItem>
                  <SelectItem value="html">HTML Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => generateReport(reportFormat)} 
                disabled={isGenerating || !case_ || !nodalResult}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Report Contents</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Well summary and operating point</li>
              <li>• IPR and VLP curve data</li>
              <li>• Completion and fluid details</li>
              <li>• Performance metrics and warnings</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => exportData('json')}
              disabled={!case_ || !nodalResult}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportData('csv')}
              disabled={!case_ || !nodalResult}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportData('txt')}
              disabled={!case_ || !nodalResult}
            >
              <Download className="h-4 w-4 mr-2" />
              Export TXT
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {case_ && nodalResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Operating Point</span>
              </div>
              <div className="text-2xl font-bold">
                {nodalResult.operating_point?.rate?.toFixed(1) ?? 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {getFlowRateUnit()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">IPR Model</span>
              </div>
              <div className="text-lg font-bold">
                {case_.ipr.type}
              </div>
              <p className="text-xs text-muted-foreground">
                {nodalResult.ipr_curve.rates.length} points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">VLP Correlation</span>
              </div>
              <div className="text-lg font-bold">
                {case_.vlp.correlation}
              </div>
              <p className="text-xs text-muted-foreground">
                {nodalResult.vlp_curve.rates.length} points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Completion</span>
              </div>
              <div className="text-lg font-bold">
                {case_.completion.perforations.length}
              </div>
              <p className="text-xs text-muted-foreground">
                perforations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status */}
      {!case_ || !nodalResult ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Complete the nodal analysis first to generate reports
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Ready to generate reports and export data
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
