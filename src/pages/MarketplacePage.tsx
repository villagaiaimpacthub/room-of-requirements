import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  DollarSign,
  User,
  Calendar,
  Tag,
  TrendingUp,
  Award,
  Coins,
  X,
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface MarketplaceItem {
  id: string;
  name: string;
  fileType: string;
  score: number;
  utility: string;
  uploader: string;
  sector: string;
  uploadDate: string;
  downloads: number;
  rating: number;
  price?: number;
  description: string;
  tags: string[];
  size: string;
}

interface MarketplacePageProps {
  searchQuery?: string;
  filterCriteria?: {
    sector?: string;
    fileType?: string;
    tags?: string[];
    priceRange?: [number, number];
  };
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ 
  searchQuery = '', 
  filterCriteria = {} 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedSector, setSelectedSector] = useState(filterCriteria.sector || 'all');
  const [selectedFileType, setSelectedFileType] = useState(filterCriteria.fileType || 'all');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatBasedSearch, setChatBasedSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Initialize marketplace items
  useEffect(() => {
    const sampleItems: MarketplaceItem[] = [
      {
        id: 'item-1',
        name: 'React Authentication Hook',
        fileType: 'code',
        score: 92,
        utility: 'Authentication',
        uploader: 'DevMaster',
        sector: 'Security',
        uploadDate: '2024-01-15',
        downloads: 1247,
        rating: 4.8,
        price: 25,
        description: 'A comprehensive React hook for handling user authentication with JWT tokens, refresh logic, and automatic logout.',
        tags: ['react', 'authentication', 'jwt', 'hooks', 'security'],
        size: '15KB'
      },
      {
        id: 'item-2',
        name: 'API Documentation Template',
        fileType: 'documentation',
        score: 87,
        utility: 'Documentation',
        uploader: 'TechWriter',
        sector: 'Documentation',
        uploadDate: '2024-01-10',
        downloads: 892,
        rating: 4.6,
        price: 15,
        description: 'Professional API documentation template with interactive examples, authentication guides, and error handling.',
        tags: ['api', 'documentation', 'template', 'swagger', 'openapi'],
        size: '8KB'
      },
      {
        id: 'item-3',
        name: 'Docker Compose Configuration',
        fileType: 'configuration',
        score: 78,
        utility: 'DevOps',
        uploader: 'CloudExpert',
        sector: 'Infrastructure',
        uploadDate: '2024-01-08',
        downloads: 634,
        rating: 4.4,
        price: 20,
        description: 'Production-ready Docker Compose setup with Redis, PostgreSQL, and monitoring tools.',
        tags: ['docker', 'compose', 'redis', 'postgresql', 'devops'],
        size: '5KB'
      },
      {
        id: 'item-4',
        name: 'React Dashboard Components',
        fileType: 'code',
        score: 95,
        utility: 'UI Components',
        uploader: 'UIExpert',
        sector: 'Frontend',
        uploadDate: '2024-01-20',
        downloads: 2156,
        rating: 4.9,
        price: 45,
        description: 'Complete set of dashboard components including charts, tables, forms, and navigation elements.',
        tags: ['react', 'dashboard', 'components', 'ui', 'charts'],
        size: '120KB'
      },
      {
        id: 'item-5',
        name: 'Node.js API Boilerplate',
        fileType: 'code',
        score: 89,
        utility: 'Backend Framework',
        uploader: 'BackendPro',
        sector: 'Backend',
        uploadDate: '2024-01-18',
        downloads: 1543,
        rating: 4.7,
        price: 35,
        description: 'Complete Node.js API boilerplate with authentication, database integration, testing, and deployment scripts.',
        tags: ['nodejs', 'api', 'express', 'mongodb', 'authentication'],
        size: '85KB'
      },
      {
        id: 'item-6',
        name: 'AI Chat Interface',
        fileType: 'code',
        score: 91,
        utility: 'AI Integration',
        uploader: 'AIBuilder',
        sector: 'AI/ML',
        uploadDate: '2024-01-22',
        downloads: 987,
        rating: 4.8,
        price: 55,
        description: 'Ready-to-use AI chat interface with streaming responses, conversation history, and multiple AI provider support.',
        tags: ['ai', 'chat', 'openai', 'streaming', 'react'],
        size: '45KB'
      },
      {
        id: 'item-7',
        name: 'Database Migration Scripts',
        fileType: 'configuration',
        score: 82,
        utility: 'Database Management',
        uploader: 'DBAdmin',
        sector: 'Database',
        uploadDate: '2024-01-12',
        downloads: 756,
        rating: 4.5,
        price: 18,
        description: 'Comprehensive database migration scripts for PostgreSQL, MySQL, and MongoDB with rollback support.',
        tags: ['database', 'migration', 'postgresql', 'mysql', 'mongodb'],
        size: '12KB'
      },
      {
        id: 'item-8',
        name: 'E-commerce Product Catalog',
        fileType: 'code',
        score: 88,
        utility: 'E-commerce',
        uploader: 'ShopBuilder',
        sector: 'E-commerce',
        uploadDate: '2024-01-16',
        downloads: 1234,
        rating: 4.6,
        price: 40,
        description: 'Complete product catalog system with search, filtering, cart functionality, and payment integration.',
        tags: ['ecommerce', 'catalog', 'search', 'cart', 'payment'],
        size: '95KB'
      }
    ];

    setMarketplaceItems(sampleItems);
    setLoading(false);
  }, []);

  // Handle URL parameters for search and filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('search');
    const sector = params.get('sector');
    const fileType = params.get('fileType');
    const chatSearch = params.get('chatSearch');

    if (query) setSearchTerm(query);
    if (sector) setSelectedSector(sector);
    if (fileType) setSelectedFileType(fileType);
    if (chatSearch) {
      setChatBasedSearch(chatSearch);
      setShowChatSearch(true);
      // Apply intelligent filtering based on chat search
      applyIntelligentFiltering(chatSearch);
    }
  }, [location.search]);

  // Apply intelligent filtering based on chat input
  const applyIntelligentFiltering = (chatInput: string) => {
    const input = chatInput.toLowerCase();
    
    // Detect intent and apply appropriate filters
    if (input.includes('authentication') || input.includes('login') || input.includes('auth')) {
      setSelectedSector('Security');
      setSearchTerm('authentication');
    } else if (input.includes('dashboard') || input.includes('admin panel') || input.includes('ui components')) {
      setSelectedSector('Frontend');
      setSearchTerm('dashboard');
    } else if (input.includes('api') || input.includes('backend') || input.includes('server')) {
      setSelectedSector('Backend');
      setSearchTerm('api');
    } else if (input.includes('database') || input.includes('db') || input.includes('storage')) {
      setSelectedSector('Database');
      setSearchTerm('database');
    } else if (input.includes('ai') || input.includes('machine learning') || input.includes('chat')) {
      setSelectedSector('AI/ML');
      setSearchTerm('ai');
    } else if (input.includes('ecommerce') || input.includes('shop') || input.includes('store')) {
      setSelectedSector('E-commerce');
      setSearchTerm('ecommerce');
    } else if (input.includes('docker') || input.includes('deployment') || input.includes('devops')) {
      setSelectedSector('Infrastructure');
      setSearchTerm('docker');
    } else {
      // Extract key terms for general search
      const terms = input.split(' ').filter(term => term.length > 3);
      if (terms.length > 0) {
        setSearchTerm(terms[0]);
      }
    }
  };

  // Filter items based on current criteria
  const filteredItems = marketplaceItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSector = selectedSector === 'all' || item.sector === selectedSector;
    const matchesFileType = selectedFileType === 'all' || item.fileType === selectedFileType;
    
    return matchesSearch && matchesSector && matchesFileType;
  });

  const handleBackToChat = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToChat}
              className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg magical-glow hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-amber-900" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Component Marketplace</h1>
              <p className="text-xs text-gray-400">Discover and acquire reusable components</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-blue-900/30 rounded-lg border border-blue-600/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-blue-200">
                  {filteredItems.length} components found
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Chat-based Search Result */}
        {showChatSearch && chatBasedSearch && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-200 font-medium mb-1">Search based on your request:</h3>
                <p className="text-amber-300/80 text-sm">"{chatBasedSearch}"</p>
                <p className="text-amber-400/60 text-xs mt-2">
                  Applied intelligent filtering based on your description
                </p>
              </div>
              <button
                onClick={() => setShowChatSearch(false)}
                className="text-amber-400/60 hover:text-amber-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components, descriptions, or tags..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Sectors</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Security">Security</option>
                  <option value="Database">Database</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="code">Code</option>
                  <option value="documentation">Documentation</option>
                  <option value="configuration">Configuration</option>
                  <option value="design">Design</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace Table */}
        {loading ? (
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading marketplace components...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Utility
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Uploader
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-800/40 transition-colors duration-200 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.score >= 90 ? 'bg-green-400' : 
                            item.score >= 80 ? 'bg-yellow-400' : 'bg-blue-400'
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-white">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.size} • {item.downloads} downloads</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.fileType === 'code' ? 'bg-blue-900/40 text-blue-200' :
                          item.fileType === 'documentation' ? 'bg-green-900/40 text-green-200' :
                          item.fileType === 'configuration' ? 'bg-purple-900/40 text-purple-200' :
                          item.fileType === 'design' ? 'bg-pink-900/40 text-pink-200' :
                          'bg-gray-700/40 text-gray-300'
                        }`}>
                          {item.fileType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.score >= 90 ? 'bg-green-400' : 
                            item.score >= 80 ? 'bg-yellow-400' : 'bg-blue-400'
                          }`} />
                          <span className="text-sm font-medium text-white">{item.score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{item.utility}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{item.uploader}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{item.sector}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Donating crypto to ${item.uploader} for ${item.name}`);
                            }}
                            className="p-1 text-gray-400 hover:text-amber-400 transition-colors duration-200"
                            title="Donate Crypto"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                          {item.price && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`Purchasing ${item.name} for $${item.price}`);
                              }}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors duration-200"
                              title={`Purchase for $${item.price}`}
                            >
                              ${item.price}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No components found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('all');
                setSelectedFileType('all');
                setShowChatSearch(false);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Component Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-700/50">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{selectedItem.name}</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedItem.fileType === 'code' ? 'bg-blue-900/40 text-blue-200' :
                        selectedItem.fileType === 'documentation' ? 'bg-green-900/40 text-green-200' :
                        selectedItem.fileType === 'configuration' ? 'bg-purple-900/40 text-purple-200' :
                        selectedItem.fileType === 'design' ? 'bg-pink-900/40 text-pink-200' :
                        'bg-gray-700/40 text-gray-300'
                      }`}>
                        {selectedItem.fileType}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">{selectedItem.rating}</span>
                      </div>
                      <span className="text-sm text-gray-400">{selectedItem.downloads} downloads</span>
                      <span className="text-sm text-gray-400">{selectedItem.size}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">by {selectedItem.uploader}</span>
                      <span className="text-gray-500">•</span>
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{selectedItem.uploadDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedItem.description}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-gray-300">Quality Score</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{selectedItem.score}</span>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-300">Utility</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{selectedItem.utility}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => alert(`Donating crypto to ${selectedItem.uploader}`)}
                      className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      Donate Crypto
                    </button>
                    {selectedItem.price && (
                      <button
                        onClick={() => alert(`Purchasing ${selectedItem.name} for $${selectedItem.price}`)}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Purchase ${selectedItem.price}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage; 