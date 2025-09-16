import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Upload, Trash2, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

import DanielOrificeCalculator from './calculators/DanielOrificeCalculator';
import ChokeRateCalculator from './calculators/ChokeRateCalculator';
import CriticalFlowCalculator from './calculators/CriticalFlowCalculator';
import GORCalculator from './calculators/GORCalculator';
import GasVelocityCalculator from './calculators/GasVelocityCalculator';

import { getStoredUnitSystem, storeUnitSystem, getStoredSession, storeSession, exportSessionToJSON, importSessionFromJSON, clearAllStoredData } from '@/lib/storage';
import type { UnitSystem, CalculationSession } from '@/types/well-testing';
import { useToast } from '@/hooks/use-toast';

const WellTestingApp = () => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [activeTab, setActiveTab] = useState('daniel-orifice');
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load stored data on mount
  useEffect(() => {
    const storedUnitSystem = getStoredUnitSystem();
    setUnitSystem(storedUnitSystem);
  }, []);

  // Handle unit system change
  const handleUnitSystemChange = (newSystem: UnitSystem) => {
    setUnitSystem(newSystem);
    storeUnitSystem(newSystem);
    toast({
      title: "Unit System Changed",
      description: `Switched to ${newSystem === 'metric' ? 'Metric' : 'Field'} units`,
    });
  };

  // Export session
  const handleExportSession = () => {
    try {
      const session = getStoredSession();
      if (!session) {
        toast({
          title: "No Data to Export",
          description: "No calculation data found to export",
          variant: "destructive",
        });
        return;
      }

      const jsonString = exportSessionToJSON(session as CalculationSession);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `well-testing-session-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Session data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export session data",
        variant: "destructive",
      });
    }
  };

  // Import session
  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string;
          const session = importSessionFromJSON(jsonString);
          if (session) {
            storeSession(session);
            window.location.reload(); // Reload to apply imported data
            toast({
              title: "Import Successful",
              description: "Session data imported successfully",
            });
          } else {
            throw new Error('Invalid file format');
          }
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to import session data. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Clear all data
  const handleClearAllData = () => {
    clearAllStoredData();
    window.location.reload(); // Reload to clear state
    toast({
      title: "Data Cleared",
      description: "All stored data has been cleared",
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render app if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                H2Oil Well Testing
              </h1>
              <Badge variant="secondary" className="text-xs">
                Professional Calculator Suite
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Unit System Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Units:</span>
                <Select value={unitSystem} onValueChange={handleUnitSystemChange}>
                  <SelectTrigger className="w-24 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Management */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSession}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportSession}
                  className="flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllData}
                  className="flex items-center space-x-1 text-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-gradient-card shadow-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
              <TabsTrigger value="daniel-orifice" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Daniel Orifice Calc
              </TabsTrigger>
              <TabsTrigger value="choke-rate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Choke Rate Estimates
              </TabsTrigger>
              <TabsTrigger value="critical-flow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Critical Flow
              </TabsTrigger>
              <TabsTrigger value="gor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">  
                GOR² Calcs
              </TabsTrigger>
              <TabsTrigger value="gas-velocity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Gas Velocity
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="daniel-orifice" className="space-y-6">
                <DanielOrificeCalculator unitSystem={unitSystem} />
              </TabsContent>

              <TabsContent value="choke-rate" className="space-y-6">
                <ChokeRateCalculator unitSystem={unitSystem} />
              </TabsContent>

              <TabsContent value="critical-flow" className="space-y-6">
                <CriticalFlowCalculator unitSystem={unitSystem} />
              </TabsContent>

              <TabsContent value="gor" className="space-y-6">
                <GORCalculator unitSystem={unitSystem} />
              </TabsContent>

              <TabsContent value="gas-velocity" className="space-y-6">
                <GasVelocityCalculator unitSystem={unitSystem} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default WellTestingApp;