-- Fix trigger and function to work with maintenance_schedules table
-- The original trigger was created for maintenanceSchedules but we're using maintenance_schedules

-- Drop the existing trigger on the camelCase table
DROP TRIGGER IF EXISTS trigger_update_next_due_date ON public.maintenanceSchedules;
DROP TRIGGER IF EXISTS trigger_update_next_due_date ON public.maintenance_schedules;

-- Recreate the function to ensure it works with the correct field names
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next due date based on frequency
  CASE NEW."frequencyType"
    WHEN 'daily' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" || ' months')::INTERVAL;
    WHEN 'quarterly' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" * 3 || ' months')::INTERVAL;
    WHEN 'semi_annual' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" * 6 || ' months')::INTERVAL;
    WHEN 'annual' THEN
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" || ' years')::INTERVAL;
    ELSE
      NEW."nextDueDate" := NEW."startDate" + (NEW."frequencyValue" || ' days')::INTERVAL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the correct snake_case table
CREATE TRIGGER trigger_update_next_due_date
  BEFORE INSERT OR UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_due_date();
