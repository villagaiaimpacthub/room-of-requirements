import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Activity, 
  Users, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Settings,
  Database,
  Zap,
  TrendingUp
} from 'lucide-react';

interface CompostingOperation {
  id: string;
  userId: string;
  sessionId: string;
  status: 'uploading' | 'parsing' | 'analyzing' | 'chunking' | 'reviewing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  currentStep: string;
  filesCount: number;
  componentsExtracted: number;
  error?: string;
}

interface SystemMetrics {
  activeConnections: number;
  totalOperations: number;
  completedOperations: number;
  errorRate: number;
  averageProcessingTime: number;
  queueLength: number;
}

const AdminDashboard: React.FC = () => {
  const [operations, setOperations] = useState<CompostingOperation[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeConnections: 0,
    totalOperations: 0,
    completedOperations: 0,
    errorRate: 0,
    averageProcessingTime: 0,
    queueLength: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection for admin monitoring
  useEffect(() => {
    console.log('🔌 Admin Dashboard connecting to WebSocket');
    const socket = io('http://localhost:3001/admin', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Admin WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Admin WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('operations-update', (updatedOperations: CompostingOperation[]) => {
      setOperations(updatedOperations);
    });

    socket.on('metrics-update', (updatedMetrics: SystemMetrics) => {
      setMetrics(updatedMetrics);
    });

    socket.on('operation-progress', (operationUpdate: Partial<CompostingOperation> & { id: string }) => {
      setOperations(prev => prev.map(op => 
        op.id === operationUpdate.id 
          ? { ...op, ...operationUpdate }
          : op
      ));
    });

    return () => {
      console.log('🔌 Admin Dashboard disconnecting');
      socket.disconnect();
    };
  }, []);

  const getStatusColor = (status: CompostingOperation['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
      case 'uploading':
      case 'parsing':
      case 'analyzing':
      case 'chunking':
      case 'reviewing': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: CompostingOperation['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'uploading':
      case 'parsing':
      case 'analyzing':
      case 'chunking':
      case 'reviewing': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: Date) => {
    const duration = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-amber-400" />
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
              </div>
              <div className="px-3 py-1 bg-amber-400/10 text-amber-400 text-xs font-medium rounded-full">
                DEVELOPMENT ONLY
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Connections</p>
                <p className="text-2xl font-semibold text-white">{metrics.activeConnections}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Operations</p>
                <p className="text-2xl font-semibold text-white">{metrics.totalOperations}</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Queue Length</p>
                <p className="text-2xl font-semibold text-white">{metrics.queueLength}</p>
              </div>
              <Database className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Error Rate</p>
                <p className="text-2xl font-semibold text-white">{metrics.errorRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Active Operations */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Active Composting Operations
            </h2>
          </div>
          
          <div className="p-6">
            {operations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No active operations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {operations.map((operation) => (
                  <div key={operation.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(operation.status)}`}>
                          {getStatusIcon(operation.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Operation {operation.id.slice(0, 8)}</h3>
                          <p className="text-sm text-slate-400">Session: {operation.sessionId.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{operation.status}</p>
                        <p className="text-xs text-slate-400">{formatDuration(operation.startTime)}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{operation.currentStep}</span>
                        <span className="text-amber-400">{operation.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operation.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Operation Details */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Files</p>
                        <p className="text-white font-medium">{operation.filesCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Components</p>
                        <p className="text-white font-medium">{operation.componentsExtracted}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">User ID</p>
                        <p className="text-white font-medium">{operation.userId.slice(0, 8)}</p>
                      </div>
                    </div>
                    
                    {/* Error Message */}
                    {operation.error && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                        <p className="text-red-400 text-sm">{operation.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Processing Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Average Processing Time</span>
                <span className="text-white font-medium">{metrics.averageProcessingTime.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completed Operations</span>
                <span className="text-white font-medium">{metrics.completedOperations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Success Rate</span>
                <span className="text-green-400 font-medium">{(100 - metrics.errorRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WebSocket Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Queue Status</span>
                <span className={`font-medium ${metrics.queueLength > 10 ? 'text-amber-400' : 'text-green-400'}`}>
                  {metrics.queueLength > 10 ? 'High Load' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Error Rate</span>
                <span className={`font-medium ${metrics.errorRate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.errorRate > 5 ? 'High' : 'Low'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 