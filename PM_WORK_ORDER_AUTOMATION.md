# Preventive Maintenance Work Order Automation

This document explains the automated work order generation system for preventive maintenance schedules.

## Overview

The system automatically creates work orders from preventive maintenance schedules, eliminating manual work order creation and ensuring no maintenance tasks are missed.

## How It Works

### 1. **Database Triggers (Real-time)**
- **Trigger**: `trigger_auto_generate_work_order`
- **Function**: `auto_generate_work_order_from_maintenance_task()`
- **When**: Automatically fires when maintenance tasks are created or updated to 'scheduled' status
- **Action**: Creates corresponding work orders in the `work_order` table

### 2. **Scheduled Functions (Batch Processing)**
- **Master Function**: `run_maintenance_automation(days_ahead)`
- **Sub-functions**:
  - `generate_scheduled_maintenance_tasks()` - Creates new maintenance tasks from active schedules
  - `mark_overdue_maintenance_tasks()` - Marks overdue tasks and updates work order priorities
  - `sync_work_order_completion()` - Syncs completed work orders back to maintenance tasks

### 3. **Configuration Management**
- **Table**: `maintenance_config`
- **Settings**:
  - `auto_generate_work_orders` - Enable/disable automation
  - `work_order_prefix` - Prefix for work order titles (default: "PM:")
  - `include_overdue_in_title` - Add "OVERDUE:" to overdue task titles

## Setup Instructions

### 1. Run Database Migrations

```sql
-- Run these migrations in order:
\i supabase/migrations/20250101000000_auto_generate_work_orders.sql
\i supabase/migrations/20250101000001_scheduled_task_generation.sql
```

### 2. Configure Automation Settings

1. Navigate to **Preventive Maintenance** → **Automation**
2. Configure your preferences:
   - ✅ Auto-generate work orders from maintenance tasks
   - Set work order prefix (e.g., "PM:")
   - ✅ Mark overdue tasks in work order titles
3. Click **Save Settings**

### 3. Test the System

1. Click **Test Automation** to run a test cycle
2. Or manually run: `SELECT run_maintenance_automation(7);`

### 4. Set Up Automated Scheduling (Optional)

#### Option A: Manual Execution
- Use the **Run Automation** button in the Maintenance Schedules page
- Recommended frequency: Daily

#### Option B: Database Cron Job (if using pg_cron extension)
```sql
-- Run automation daily at 6 AM
SELECT cron.schedule('maintenance-automation', '0 6 * * *', 'SELECT run_maintenance_automation(7);');
```

#### Option C: External Cron Job
```bash
# Add to your server's crontab
0 6 * * * curl -X POST "https://your-supabase-url/rest/v1/rpc/run_maintenance_automation" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days_ahead": 7}'
```

## Workflow

### Creating PM Schedules → Work Orders

1. **Create PM Schedule**
   - Set frequency (daily, weekly, monthly, etc.)
   - Configure start date and priority
   - Enable "Auto-generate work orders" option

2. **System Generates Tasks**
   - When schedules become due, maintenance tasks are created
   - Tasks are automatically assigned based on schedule settings

3. **Work Orders Auto-Created**
   - Database trigger fires when tasks are created
   - Work orders are generated with:
     - Title: "PM: [Task Name]"
     - Status: "open"
     - Priority: Inherited from maintenance task
     - Location: From asset information
     - Assigned to: From schedule settings

4. **Overdue Management**
   - Tasks past due date are marked as "overdue"
   - Corresponding work orders get priority boost:
     - 3+ days overdue → High priority
     - 7+ days overdue → Critical priority
   - Title updated to include "OVERDUE:" prefix

5. **Completion Sync**
   - When work orders are marked as completed
   - Corresponding maintenance tasks are automatically completed
   - Next PM schedule due date is calculated

## Database Schema

### Key Tables
- `maintenance_schedules` - PM schedule definitions
- `maintenance_tasks` - Individual scheduled tasks
- `work_order` - Work orders (includes PM-generated ones)
- `maintenance_config` - Automation settings
- `maintenance_history` - Audit trail

### Key Functions
- `auto_generate_work_order_from_maintenance_task()` - Trigger function
- `run_maintenance_automation(days_ahead)` - Master automation function
- `generate_scheduled_maintenance_tasks(days_ahead)` - Task generation
- `mark_overdue_maintenance_tasks()` - Overdue management
- `sync_work_order_completion()` - Completion sync

## Work Order Integration

### Auto-Generated Work Order Properties
```sql
{
  "type": "job",
  "title": "PM: [Schedule Name] - [Asset Name]",
  "description": "[Schedule Description]",
  "status": "open",
  "priority": "[inherited from schedule]",
  "propertyUnit": "[Asset Location]",
  "scheduledDate": "[Task Due Date]",
  "assignedTo": "[From Schedule]",
  "comment": "Auto-generated from maintenance task ID: [task_id] | Asset: [asset_name]"
}
```

### Linking Mechanism
- Work orders are linked to maintenance tasks via the `comment` field
- Pattern: `"Auto-generated from maintenance task ID: {task_id}"`
- This enables bi-directional sync between work orders and maintenance tasks

## Monitoring & Troubleshooting

### Check Automation Status
```sql
-- View recent automation runs
SELECT * FROM maintenance_history 
WHERE performed_by = 'system' 
ORDER BY action_date DESC 
LIMIT 10;

-- Check configuration
SELECT * FROM maintenance_config;

-- View work orders created from PM tasks
SELECT wo.*, mt.title as task_title 
FROM work_order wo
JOIN maintenance_tasks mt ON wo.comment LIKE '%maintenance task ID: ' || mt.id || '%'
WHERE wo.createdAt > NOW() - INTERVAL '7 days';
```

### Common Issues

1. **Work Orders Not Being Created**
   - Check if `auto_generate_work_orders` is set to 'true'
   - Verify trigger exists: `\df auto_generate_work_order_from_maintenance_task`
   - Check for errors in maintenance_history table

2. **Duplicate Work Orders**
   - System prevents duplicates by checking existing work orders
   - If duplicates occur, check the comment field matching logic

3. **Tasks Not Being Generated**
   - Verify schedules are active (`is_active = true`)
   - Check if `next_due_date` is within the automation window
   - Run manual test: `SELECT * FROM generate_scheduled_maintenance_tasks(7);`

## Benefits

✅ **Eliminates Manual Work**: No need to manually create work orders for PM tasks
✅ **Prevents Missed Maintenance**: Automatic scheduling ensures nothing is forgotten
✅ **Priority Management**: Overdue tasks automatically get higher priority
✅ **Bi-directional Sync**: Work order completion updates maintenance records
✅ **Audit Trail**: Complete history of all automated actions
✅ **Configurable**: Flexible settings for different organizational needs

## API Usage

### Run Automation via API
```javascript
// Run automation for next 7 days
const { data, error } = await supabase.rpc('run_maintenance_automation', {
  days_ahead: 7
});

console.log('Results:', data);
// {
//   "timestamp": "2025-01-01T06:00:00Z",
//   "tasks_created": 5,
//   "tasks_marked_overdue": 2,
//   "tasks_synced_from_work_orders": 3,
//   "days_ahead_scheduled": 7
// }
```

### Check Configuration
```javascript
const { data: config } = await supabase
  .from('maintenance_config')
  .select('*');
```

### Manual Task Generation
```javascript
const { data: tasks } = await supabase.rpc('generate_scheduled_maintenance_tasks', {
  days_ahead: 14
});
```

This automation system provides a robust, scalable solution for managing preventive maintenance work orders with minimal manual intervention.