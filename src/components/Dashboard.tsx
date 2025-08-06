import React from 'react';
import { FileText, AlertTriangle, Building2, BarChart3, ChevronDown } from 'lucide-react';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  // Mock data for the dashboard
  const stats = [
    { title: 'Total Properties', value: '24', icon: Building2, color: 'bg-blue-600' },
    { title: 'Active Issues', value: '8', icon: AlertTriangle, color: 'bg-yellow-500' },
    { title: 'Pending Approvals', value: '3', icon: FileText, color: 'bg-purple-600' },
    { title: 'This Month', value: '12%', trend: 'up', icon: BarChart3, color: 'bg-green-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold">{stat.value}</p>
                {stat.trend && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    {stat.trend === 'up' ? '↑' : '↓'} 12%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-sm text-blue-600 hover:underline flex items-center">
            View All
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New document uploaded</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <span className="text-sm text-gray-500">View</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
            <button className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Task {item}</p>
                    <p className="text-sm text-gray-500">Due in {item} day{item !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileText, label: 'New Document' },
              { icon: AlertTriangle, label: 'Report Issue' },
              { icon: Building2, label: 'Add Property' },
              { icon: BarChart3, label: 'View Reports' }
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <action.icon className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-sm text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
