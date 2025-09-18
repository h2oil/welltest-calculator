-- Create well_projects table
CREATE TABLE IF NOT EXISTS well_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  well_name TEXT NOT NULL,
  client_name TEXT,
  location_name TEXT,
  country TEXT,
  state_province TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_url TEXT,
  well_type TEXT DEFAULT 'production',
  operator_name TEXT,
  field_name TEXT,
  reservoir_name TEXT,
  spud_date DATE,
  completion_date DATE,
  total_depth DECIMAL(10, 2),
  measured_depth DECIMAL(10, 2),
  true_vertical_depth DECIMAL(10, 2),
  unit_system TEXT DEFAULT 'field' CHECK (unit_system IN ('metric', 'field')),
  project_data JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  template_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create well_configurations table for saving specific calculation runs
CREATE TABLE IF NOT EXISTS well_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES well_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  configuration_name TEXT NOT NULL,
  configuration_data JSONB NOT NULL DEFAULT '{}',
  calculation_results JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_well_projects_user_id ON well_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_well_projects_well_name ON well_projects(well_name);
CREATE INDEX IF NOT EXISTS idx_well_projects_created_at ON well_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_well_configurations_project_id ON well_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_well_configurations_user_id ON well_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_well_configurations_created_at ON well_configurations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE well_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE well_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own well projects" ON well_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own well projects" ON well_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own well projects" ON well_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own well projects" ON well_projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own well configurations" ON well_configurations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own well configurations" ON well_configurations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own well configurations" ON well_configurations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own well configurations" ON well_configurations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_well_projects_updated_at
  BEFORE UPDATE ON well_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_well_configurations_updated_at
  BEFORE UPDATE ON well_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
