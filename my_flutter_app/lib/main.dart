import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mobile App Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  final List<Task> _tasks = [];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Mobile App Demo'),
        elevation: 0,
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          const DashboardTab(),
          TasksTab(tasks: _tasks, onTaskAdded: _addTask),
          const ProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.task),
            label: 'Tasks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        onTap: _onItemTapped,
      ),
    );
  }

  void _addTask(Task task) {
    setState(() {
      _tasks.add(task);
    });
  }
}

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome to Your Dashboard',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            children: [
              _buildDashboardCard(
                'Tasks',
                Icons.task,
                Colors.blue,
                '5 pending',
              ),
              _buildDashboardCard(
                'Calendar',
                Icons.calendar_today,
                Colors.green,
                '3 events',
              ),
              _buildDashboardCard(
                'Messages',
                Icons.message,
                Colors.orange,
                '12 unread',
              ),
              _buildDashboardCard(
                'Settings',
                Icons.settings,
                Colors.purple,
                'Configure',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardCard(String title, IconData icon, Color color, String subtitle) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(subtitle, style: TextStyle(color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }
}

class TasksTab extends StatefulWidget {
  final List<Task> tasks;
  final Function(Task) onTaskAdded;

  const TasksTab({super.key, required this.tasks, required this.onTaskAdded});

  @override
  State<TasksTab> createState() => _TasksTabState();
}

class _TasksTabState extends State<TasksTab> {
  final TextEditingController _taskController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _taskController,
                  decoration: const InputDecoration(
                    hintText: 'Enter a new task',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _addTask,
                child: const Icon(Icons.add),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: widget.tasks.isEmpty
                ? const Center(
                    child: Text(
                      'No tasks yet. Add one above!',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    itemCount: widget.tasks.length,
                    itemBuilder: (context, index) {
                      final task = widget.tasks[index];
                      return Card(
                        child: ListTile(
                          leading: Checkbox(
                            value: task.isCompleted,
                            onChanged: (value) {
                              setState(() {
                                task.isCompleted = value ?? false;
                              });
                            },
                          ),
                          title: Text(
                            task.title,
                            style: TextStyle(
                              decoration: task.isCompleted
                                  ? TextDecoration.lineThrough
                                  : TextDecoration.none,
                            ),
                          ),
                          subtitle: Text(task.createdAt.toString().split(' ')[0]),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () {
                              setState(() {
                                widget.tasks.removeAt(index);
                              });
                            },
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _addTask() {
    if (_taskController.text.isNotEmpty) {
      widget.onTaskAdded(Task(
        title: _taskController.text,
        createdAt: DateTime.now(),
      ));
      _taskController.clear();
    }
  }

  @override
  void dispose() {
    _taskController.dispose();
    super.dispose();
  }
}

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const CircleAvatar(
            radius: 50,
            backgroundColor: Colors.blue,
            child: Icon(Icons.person, size: 50, color: Colors.white),
          ),
          const SizedBox(height: 16),
          const Text(
            'John Doe',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const Text(
            'john.doe@example.com',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 32),
          _buildProfileOption(Icons.edit, 'Edit Profile'),
          _buildProfileOption(Icons.notifications, 'Notifications'),
          _buildProfileOption(Icons.security, 'Privacy & Security'),
          _buildProfileOption(Icons.help, 'Help & Support'),
          _buildProfileOption(Icons.logout, 'Logout'),
        ],
      ),
    );
  }

  Widget _buildProfileOption(IconData icon, String title) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          // Handle navigation
        },
      ),
    );
  }
}

class Task {
  String title;
  bool isCompleted;
  DateTime createdAt;

  Task({
    required this.title,
    this.isCompleted = false,
    required this.createdAt,
  });
}
