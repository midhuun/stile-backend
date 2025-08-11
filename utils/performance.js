const performanceMetrics = {
  requests: new Map(),
  startTime: Date.now(),
};

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  const requestId = `${req.method}-${req.originalUrl}-${Date.now()}`;
  
  // Store request start time
  performanceMetrics.requests.set(requestId, { start, url: req.originalUrl, method: req.method });
  
  res.on('finish', () => {
    const end = Date.now();
    const duration = end - start;
    const request = performanceMetrics.requests.get(requestId);
    
    if (request) {
      request.duration = duration;
      request.statusCode = res.statusCode;
      
      // Log slow requests (> 1 second)
      if (duration > 1000) {
        console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} - ${duration}ms`);
      }
      
      // Log performance metrics for key endpoints
      if (req.originalUrl === '/products' || req.originalUrl === '/banner') {
        console.log(`PERFORMANCE: ${req.method} ${req.originalUrl} - ${duration}ms - ${res.statusCode}`);
      }
    }
    
    // Clean up old requests (keep only last 100)
    if (performanceMetrics.requests.size > 100) {
      const keys = Array.from(performanceMetrics.requests.keys());
      keys.slice(0, 50).forEach(key => performanceMetrics.requests.delete(key));
    }
  });
  
  next();
};

// Get performance statistics
const getPerformanceStats = () => {
  const requests = Array.from(performanceMetrics.requests.values());
  const totalRequests = requests.length;
  const avgDuration = totalRequests > 0 
    ? requests.reduce((sum, req) => sum + (req.duration || 0), 0) / totalRequests 
    : 0;
  
  const slowRequests = requests.filter(req => (req.duration || 0) > 1000).length;
  
  return {
    totalRequests,
    avgDuration: Math.round(avgDuration),
    slowRequests,
    uptime: Date.now() - performanceMetrics.startTime,
  };
};

module.exports = {
  performanceMiddleware,
  getPerformanceStats,
};
