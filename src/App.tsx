import React, { useState, useEffect } from 'react'
import { CheckCircle, Circle, Plus, Server, Activity, FileText, BookOpen, ExternalLink } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  progress?: number
  subtasks?: Array<{
    id: string
    title: string
    status: 'todo' | 'in-progress' | 'done'
  }>
}

interface ApiResponse {
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  totalSubtasks: number
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check server health
  const checkServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/health')
      if (response.ok) {
        setServerStatus('online')
        return true
      } else {
        setServerStatus('offline')
        return false
      }
    } catch (error) {
      setServerStatus('offline')
      return false
    }
  }

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3001/api/v1/tasks')
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setTasks(data.tasks)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch tasks')
      }
    } catch (error) {
      setError('Failed to connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // Test API endpoint
  const testApi = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/test')
      if (response.ok) {
        const data = await response.json()
        alert(`API Test Successful: ${data.message}`)
      } else {
        alert('API test failed')
      }
    } catch (error) {
      alert('Failed to connect to API')
    }
  }

  useEffect(() => {
    checkServerHealth()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-300 bg-red-900/50'
      case 'medium': return 'text-yellow-300 bg-yellow-900/50'
      case 'low': return 'text-green-300 bg-green-900/50'
      default: return 'text-slate-300 bg-slate-700'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'done' ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <Circle className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TM</span>
              </div>
              <h1 className="text-2xl font-bold text-white">TaskMaster</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Server Status */}
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className={`text-sm font-medium ${
                  serverStatus === 'online' ? 'text-green-400' : 
                  serverStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {serverStatus === 'checking' ? 'Checking...' : 
                   serverStatus === 'online' ? 'Server Online' : 'Server Offline'}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus === 'online' ? 'bg-green-500' : 
                  serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              </div>
              
              <button
                onClick={testApi}
                className="px-3 py-1 text-sm bg-blue-900 text-blue-300 rounded-md hover:bg-blue-800 transition-colors"
              >
                Test API
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Project Tasks</h2>
          <div className="flex space-x-3">
            <button
              onClick={fetchTasks}
              disabled={loading || serverStatus !== 'online'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>{loading ? 'Loading...' : 'Load Tasks'}</span>
            </button>
            <button
              onClick={checkServerHealth}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Server className="w-4 h-4" />
              <span>Check Server</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Tasks Grid */}
        {tasks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <h3 className="font-medium text-white">{task.title}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm mb-4">{task.description}</p>
                
                {task.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Subtasks:</h4>
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                        {getStatusIcon(subtask.status)}
                        <span className={subtask.status === 'done' ? 'line-through text-slate-500' : 'text-slate-300'}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'done' ? 'bg-green-900/50 text-green-300' :
                    task.status === 'in-progress' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No tasks found</h3>
            <p className="text-slate-400 mb-4">
              {serverStatus === 'offline' 
                ? 'Server is offline. Please start the backend server first.'
                : 'Click "Load Tasks" to fetch tasks from the server, or generate tasks using TaskMaster AI first.'
              }
            </p>
          </div>
        )}

        {/* Documentation Section */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">📚 Documentation & Templates</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* README */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-6 h-6 text-blue-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-2">README Guide</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Complete setup instructions, workflow guide, and TaskMaster AI usage tips.
                  </p>
                  <button
                    onClick={() => window.open('https://github.com/villagaiaimpacthub/taskmaster-template/blob/master/README.md', '_blank')}
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    <span>View README</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Requirements Template */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-green-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-2">Requirements Template</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Gather your initial project requirements before creating a detailed PRD.
                  </p>
                  <button
                    onClick={() => window.open('https://github.com/villagaiaimpacthub/taskmaster-template/blob/master/scripts/your-requirements.md', '_blank')}
                    className="flex items-center space-x-2 text-green-400 hover:text-green-300 text-sm transition-colors"
                  >
                    <span>View Template</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* PRD Template */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-purple-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-2">PRD Template</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Comprehensive Product Requirements Document template for detailed project planning.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.open('https://github.com/villagaiaimpacthub/taskmaster-template/blob/master/scripts/your-prd-template.md', '_blank')}
                      className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    >
                      <span>View Template</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open('https://github.com/villagaiaimpacthub/taskmaster-template/blob/master/scripts/example-prd.md', '_blank')}
                      className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 text-sm transition-colors"
                    >
                      <span>View Example (ImgxAI)</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Troubleshooting Guide */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div className="flex items-start space-x-3">
                <Activity className="w-6 h-6 text-red-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-2">Troubleshooting Guide</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Common issues and solutions for development problems and TaskMaster AI setup.
                  </p>
                  <button
                    onClick={() => window.open('https://github.com/villagaiaimpacthub/taskmaster-template/blob/master/scripts/troubleshooting.md', '_blank')}
                    className="flex items-center space-x-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    <span>View Guide</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start Guide */}
          <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="font-medium text-white mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Quick Start Guide</span>
            </h3>
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-blue-300 text-sm mb-2">
                📚 <strong>Based on the methodology from:</strong>
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => window.open('https://shipixen.com/tutorials/reduce-ai-coding-errors-with-taskmaster-ai', '_blank')}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <span>Shipixen Tutorial: Olympic-Level Vibe Coding</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => window.open('https://www.npmjs.com/package/task-master-ai', '_blank')}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <span>TaskMaster AI Package</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">1. Plan Your Project</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Fill out the Requirements Template</li>
                  <li>• Create a detailed PRD</li>
                  <li>• Define success metrics</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">2. Generate Tasks</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Use TaskMaster AI with your PRD</li>
                  <li>• Break down complex features</li>
                  <li>• Prioritize implementation order</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">3. Start Building</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Implement tasks iteratively</li>
                  <li>• Test frequently</li>
                  <li>• Update tasks as needed</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">4. Deploy & Monitor</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Set up CI/CD pipeline</li>
                  <li>• Monitor performance</li>
                  <li>• Gather user feedback</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 