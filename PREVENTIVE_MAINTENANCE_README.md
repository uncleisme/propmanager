# Preventive Maintenance Module

## Overview
The Preventive Maintenance module is a comprehensive solution for managing building assets, scheduling maintenance tasks, and tracking maintenance history. It provides a proactive approach to building maintenance management.

## Features

### 1. Dashboard
- **Real-time Statistics**: Total assets, active schedules, overdue tasks, today's tasks, weekly tasks, and completed tasks
- **Overdue Tasks Alert**: Prominent display of overdue maintenance tasks
- **Upcoming Tasks**: Preview of scheduled maintenance tasks for the next 7 days
- **Quick Navigation**: Direct access to all maintenance sub-modules

### 2. Asset Management
- **Asset Categories**: Organize assets by type (HVAC, Electrical, Plumbing, Elevators, etc.)
- **Asset Details**: Track asset information including location, make/model, serial numbers, warranties
- **Asset Status**: Active, Inactive, Maintenance, Retired status tracking
- **Criticality Levels**: Low, Medium, High, Critical priority assignment
- **Search & Filtering**: Advanced filtering by status, category, and criticality

### 3. Maintenance Schedules
- **Recurring Schedules**: Daily, Weekly, Monthly, Quarterly, Semi-annual, Annual frequencies
- **Schedule Templates**: Predefined maintenance types with estimated durations
- **Priority Management**: Task prioritization system
- **Automatic Task Generation**: System automatically creates tasks based on schedules
- **Schedule Status**: Active/Inactive schedule management

### 4. Maintenance Tasks (Planned)
- **Task Management**: Complete CRUD operations for maintenance tasks
- **Status Tracking**: Scheduled, In Progress, Completed, Cancelled, Overdue
- **Work Instructions**: Detailed task descriptions and checklists
- **Time Tracking**: Actual vs. estimated duration tracking
- **Cost Tracking**: Labor and parts cost management
- **File Attachments**: Support for photos and documents

### 5. Maintenance History (Planned)
- **Audit Trail**: Complete history of all maintenance activities
- **Performance Metrics**: Task completion rates and timing analysis
- **Cost Analysis**: Historical cost tracking and trends
- **Reporting**: Comprehensive maintenance reports

## Database Schema

### Core Tables
1. **asset_categories**: Asset categorization system
2. **maintenance_assets**: Asset registry with detailed information
3. **maintenance_types**: Predefined maintenance procedure templates
4. **maintenance_schedules**: Recurring maintenance schedule definitions
5. **maintenance_tasks**: Individual maintenance work orders
6. **maintenance_history**: Audit trail of all maintenance activities

### Key Features
- **Row Level Security (RLS)**: Secure data access control
- **Automatic Triggers**: Task number generation and due date calculation
- **JSONB Support**: Flexible storage for specifications and checklists
- **Comprehensive Indexing**: Optimized for performance

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase Client** for database operations

### Backend
- **Supabase** (PostgreSQL) for database
- **Real-time subscriptions** for live updates
- **PostgreSQL functions** for business logic
- **Automated triggers** for data consistency

## Installation & Setup

### 1. Database Setup
Run the SQL schema file to create all necessary tables:
```sql
-- Execute create_preventive_maintenance_tables.sql in your Supabase dashboard
```

### 2. Component Integration
The module is already integrated into the main application through:
- `App.tsx` routing
- `Layout.tsx` navigation menu
- Type definitions in `types/index.ts`

### 3. Navigation
Access the module through:
- Main menu → "MAINTENANCE" → "Preventive Maintenance"
- Direct routes: `/preventive-maintenance`, `/maintenance-assets`, `/maintenance-schedules`

## Usage Guide

### Getting Started
1. **Set up Asset Categories**: The system comes with predefined categories
2. **Add Assets**: Register all building assets with detailed information
3. **Create Schedules**: Set up recurring maintenance schedules for assets
4. **Monitor Tasks**: Use the dashboard to track upcoming and overdue tasks

### Best Practices
1. **Asset Categorization**: Use appropriate categories for better organization
2. **Criticality Assignment**: Properly assign criticality levels for prioritization
3. **Regular Monitoring**: Check the dashboard regularly for overdue tasks
4. **Complete Documentation**: Add detailed notes and specifications for assets

## API Endpoints

### Assets
- `GET /maintenance_assets` - List all assets with filtering
- `POST /maintenance_assets` - Create new asset
- `PUT /maintenance_assets/:id` - Update asset
- `DELETE /maintenance_assets/:id` - Delete asset

### Schedules
- `GET /maintenance_schedules` - List all schedules
- `POST /maintenance_schedules` - Create new schedule
- `PUT /maintenance_schedules/:id` - Update schedule
- `DELETE /maintenance_schedules/:id` - Delete schedule

### Categories
- `GET /asset_categories` - List all asset categories
- `POST /asset_categories` - Create new category

## Future Enhancements

### Phase 2 Features
1. **Mobile App**: Field technician mobile application
2. **IoT Integration**: Sensor data integration for predictive maintenance
3. **Inventory Management**: Parts and supplies tracking
4. **Vendor Management**: External service provider coordination
5. **Work Order Optimization**: Route optimization for technicians

### Advanced Features
1. **Machine Learning**: Predictive maintenance using historical data
2. **Integration APIs**: Connect with existing CMMS systems
3. **Advanced Reporting**: Custom report builder
4. **Workflow Automation**: Automated task assignment and notifications

## Support & Maintenance

### Error Handling
- All database operations include proper error handling
- User-friendly error messages displayed in the UI
- Console logging for debugging purposes

### Performance Considerations
- Database queries are optimized with proper indexing
- Pagination implemented for large datasets
- Efficient filtering and search capabilities

### Security
- Row Level Security (RLS) enabled on all tables
- User authentication required for all operations
- Proper data validation on both client and server side

## Contributing
When extending this module:
1. Follow the existing code patterns and TypeScript interfaces
2. Implement proper error handling and loading states
3. Add appropriate database indexes for new queries
4. Update this documentation for new features

## Version History
- **v1.0**: Initial implementation with dashboard, assets, and schedules
- **v1.1**: Planned - Tasks and history modules
- **v2.0**: Planned - Mobile app and advanced features