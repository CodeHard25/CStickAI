import React, { useState, useRef } from 'react';
import { Upload, TrendingUp, TrendingDown, Minus, Camera, BarChart3, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

// Type definitions
interface ClassConfidences {
  buy: number;
  sell: number;
  hold: number;
}

interface Prediction {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strength: string;
  class_confidences: ClassConfidences;
}

interface PredictionHistoryItem {
  id: number;
  filename: string;
  prediction: Prediction;
  timestamp: string;
  preview: string;
}

interface PredictionResponse {
  success: boolean;
  prediction: Prediction;
}

const CandlestickPredictionApp: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = 'http://localhost:8000';

  const handleFileSelect = (file: File | null): void => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setPrediction(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>): void => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const makePrediction = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PredictionResponse = await response.json();
      
      if (result.success) {
        setPrediction(result.prediction);
        
        // Add to history
        const historyItem: PredictionHistoryItem = {
          id: Date.now(),
          filename: selectedFile.name,
          prediction: result.prediction,
          timestamp: new Date().toLocaleString(),
          preview: preview || ''
        };
        setPredictionHistory(prev => [historyItem, ...prev.slice(0, 4)]);
      } else {
        throw new Error('Prediction failed');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to get prediction. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = (): void => {
    setSelectedFile(null);
    setPreview(null);
    setPrediction(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getActionIcon = (action: string): JSX.Element => {
    switch (action) {
      case 'BUY':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      case 'HOLD':
        return <Minus className="w-6 h-6 text-yellow-500" />;
      default:
        return <BarChart3 className="w-6 h-6 text-gray-500" />;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'BUY':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HOLD':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CandleStick AI</h1>
                <p className="text-sm text-gray-500">Trading Signal Prediction</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Model Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Upload Candlestick Chart</span>
                </h2>
                <p className="text-gray-600 mt-1">Upload a candlestick chart image to get AI-powered trading signals</p>
              </div>
              
              <div className="p-6">
                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDrag}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {!preview ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your chart image here
                        </p>
                        <p className="text-gray-500">or click to browse files</p>
                      </div>
                      <div className="text-sm text-gray-400">
                        Supports PNG, JPG, JPEG • Max size: 10MB
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={preview}
                          alt="Chart preview"
                          className="max-w-full max-h-64 rounded-lg shadow-md"
                        />
                        <button
                          onClick={clearSelection}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Predict Button */}
                <div className="mt-6">
                  <button
                    onClick={makePrediction}
                    disabled={!selectedFile || loading}
                    className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Chart...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5" />
                        <span>Get AI Prediction</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Prediction Result */}
            {prediction && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>AI Prediction Result</span>
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Prediction */}
                    <div className={`p-6 rounded-xl border-2 ${getActionColor(prediction.action)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getActionIcon(prediction.action)}
                          <div>
                            <h3 className="text-2xl font-bold">{prediction.action}</h3>
                            <p className="text-sm opacity-75">Recommended Action</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{prediction.confidence}%</div>
                          <div className="text-sm opacity-75">{prediction.strength}</div>
                        </div>
                      </div>
                      
                      {/* Confidence Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getConfidenceColor(prediction.confidence)} transition-all duration-500`}
                          style={{ width: `${prediction.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Class Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Confidence Breakdown</h4>
                      
                      {/* Buy */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Buy</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${prediction.class_confidences?.buy || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {prediction.class_confidences?.buy || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Sell */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium">Sell</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${prediction.class_confidences?.sell || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {prediction.class_confidences?.sell || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Hold */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Minus className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Hold</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${prediction.class_confidences?.hold || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {prediction.class_confidences?.hold || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">1</span>
                  </div>
                  <p>Upload a candlestick chart image of any stock or cryptocurrency</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">2</span>
                  </div>
                  <p>Our AI model analyzes chart patterns using deep learning</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">3</span>
                  </div>
                  <p>Get instant trading signals with confidence scores</p>
                </div>
              </div>
            </div>

            {/* Recent Predictions */}
            {predictionHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Recent Predictions</h3>
                </div>
                <div className="p-6 space-y-4">
                  {predictionHistory.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.preview}
                        alt="Chart"
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.filename}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getActionIcon(item.prediction.action)}
                          <span className="text-sm text-gray-600">
                            {item.prediction.action} ({item.prediction.confidence}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <h4 className="font-semibold mb-2">Investment Disclaimer</h4>
                  <p>
                    This AI prediction is for educational purposes only. Always do your own research 
                    and consult with financial advisors before making investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickPredictionApp;