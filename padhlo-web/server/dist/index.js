"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const exam_1 = __importDefault(require("./routes/exam"));
const progress_1 = __importDefault(require("./routes/progress"));
const test_1 = __importDefault(require("./routes/test"));
const simplePractice_1 = __importDefault(require("./routes/simplePractice"));
const enhancedPractice_1 = __importDefault(require("./routes/enhancedPractice"));
const dynamicExam_1 = __importDefault(require("./routes/dynamicExam"));
// Load environment variables
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/exam', exam_1.default);
app.use('/api/progress', progress_1.default);
app.use('/api/test', test_1.default);
app.use('/api/practice', simplePractice_1.default);
app.use('/api/practice/enhanced', enhancedPractice_1.default);
app.use('/api/exam/dynamic', dynamicExam_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});
// Serve static files from Next.js build in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path_1.default.resolve(__dirname, '../../frontend/out');
    console.log('Serving static files from:', frontendPath);
    app.use(express_1.default.static(frontendPath));
    // Handle Next.js routing
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
}
else {
    // In development, serve a simple HTML page that proxies to Next.js dev server
    app.get('*', (req, res) => {
        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Padhlo - Development Mode</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 40px;
              background: #f8fafc;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #1f2937;
              margin-bottom: 20px;
            }
            .status {
              background: #d1fae5;
              color: #065f46;
              padding: 12px 16px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .api-list {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .api-list h3 {
              margin-top: 0;
              color: #374151;
            }
            .api-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .api-list li {
              margin-bottom: 8px;
              color: #6b7280;
            }
            .dev-note {
              background: #fef3c7;
              color: #92400e;
              padding: 12px 16px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
            .dev-note strong {
              display: block;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Padhlo Backend Server</h1>
            
            <div class="status">
              ✅ Server is running on port ${PORT}
            </div>
            
            <div class="api-list">
              <h3>Available API Endpoints:</h3>
              <ul>
                <li><strong>Health Check:</strong> <a href="/health">GET /health</a></li>
                <li><strong>Authentication:</strong> <a href="/api/auth">/api/auth</a></li>
                <li><strong>Users:</strong> <a href="/api/user">/api/user</a></li>
                <li><strong>Exams:</strong> <a href="/api/exam">/api/exam</a></li>
                <li><strong>Progress:</strong> <a href="/api/progress">/api/progress</a></li>
                <li><strong>Tests:</strong> <a href="/api/test">/api/test</a></li>
                <li><strong>Practice:</strong> <a href="/api/practice">/api/practice</a></li>
                <li><strong>Enhanced Practice:</strong> <a href="/api/practice/enhanced">/api/practice/enhanced</a></li>
                <li><strong>Dynamic Exams:</strong> <a href="/api/exam/dynamic">/api/exam/dynamic</a></li>
              </ul>
            </div>
            
            <div class="dev-note">
              <strong>Development Mode</strong>
              <p>This is the backend server running in development mode. The frontend is not currently served through this server.</p>
              <p>To run the full web application:</p>
              <ol>
                <li>Build the frontend: <code>npm run build:frontend</code></li>
                <li>Set NODE_ENV=production</li>
                <li>Restart the server</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `);
    });
}
// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found',
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👤 User endpoints: http://localhost:${PORT}/api/user`);
    console.log(`📚 Exam endpoints: http://localhost:${PORT}/api/exam`);
    console.log(`📈 Progress endpoints: http://localhost:${PORT}/api/progress`);
    console.log(`🧪 Test endpoints: http://localhost:${PORT}/api/test`);
    console.log(`🎯 Practice endpoints: http://localhost:${PORT}/api/practice`);
    console.log(`🎯 Enhanced Practice endpoints: http://localhost:${PORT}/api/practice/enhanced`);
    console.log(`📝 Dynamic Exam endpoints: http://localhost:${PORT}/api/exam/dynamic`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Web app: http://localhost:${PORT}`);
    }
    else {
        console.log(`🔧 Development mode: http://localhost:${PORT}`);
    }
});
//# sourceMappingURL=index.js.map