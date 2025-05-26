# TaskMaster Template Troubleshooting Guide

## Common Issues and Solutions

### 1. Module Not Found Errors (date-fns)

**Error:**
```
Error: Cannot find module '../_lib/requiredArgs/index.js'
Require stack:
- C:\TaskMaster-Template\node_modules\date-fns\isDate\index.js
```

**Solution:**
This is typically caused by corrupted node_modules. Fix with:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install
```

**Alternative solution:**
```bash
# Use npm ci for clean install
npm ci
```

### 2. Tasks.json File Not Found

**Error:**
```
ENOENT: no such file or directory, open 'C:\TaskMaster-Template\tasks\tasks.json'
```

**Solution:**
The backend is looking for a tasks.json file. This template includes a sample file:

```bash
# Ensure the tasks directory exists
mkdir -p tasks

# The sample tasks.json should already be there, but if missing:
# Copy from the template or create a basic one
echo '{"tasks": [], "totalTasks": 0, "completedTasks": 0, "totalSubtasks": 0}' > tasks/tasks.json
```

### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find and kill the process using the port
# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# On macOS/Linux:
lsof -ti:3001 | xargs kill -9

# Or use a different port in package.json
```

### 4. CORS Issues

**Error:**
```
Access to fetch at 'http://localhost:3001/api/v1/tasks' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
The backend already includes CORS configuration, but if you're still seeing issues:

1. Check that both servers are running
2. Verify the frontend is making requests to the correct backend URL
3. Ensure the backend CORS configuration includes your frontend origin

### 5. TypeScript Compilation Errors

**Error:**
```
Type 'string' is not assignable to type 'never'
```

**Solution:**
```bash
# Clear TypeScript cache
npx tsc --build --clean

# Restart TypeScript server in your editor
# In VS Code: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 6. Vite Build Issues

**Error:**
```
[vite] Internal server error: Failed to resolve import
```

**Solution:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run client:dev
```

### 7. TaskMaster AI MCP Server Issues

**Error:**
```
MCP server "taskmaster-ai" failed to start
```

**Solutions:**

1. **Check API Keys:**
   ```json
   {
     "mcpServers": {
       "taskmaster-ai": {
         "env": {
           "ANTHROPIC_API_KEY": "your_actual_key_here",
           "PERPLEXITY_API_KEY": "your_actual_key_here"
         }
       }
     }
   }
   ```

2. **Verify Node.js Version:**
   ```bash
   node --version  # Should be 18+ 
   ```

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

4. **Restart Cursor:**
   Close and reopen Cursor completely

### 8. Git Issues

**Error:**
```
fatal: not a git repository
```

**Solution:**
```bash
# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit"

# Add remote origin (optional)
git remote add origin https://github.com/yourusername/your-repo.git
```

### 9. Environment Variables Not Loading

**Error:**
```
process.env.ANTHROPIC_API_KEY is undefined
```

**Solution:**
1. Ensure `.env` file exists in project root
2. Check `.env` file format:
   ```
   ANTHROPIC_API_KEY=your_key_here
   PERPLEXITY_API_KEY=your_key_here
   ```
3. Restart your development server after adding environment variables

### 10. Frontend Not Connecting to Backend

**Symptoms:**
- Server status shows "offline"
- API calls fail
- No data loads

**Solutions:**

1. **Check both servers are running:**
   ```bash
   # Terminal 1: Backend
   npm run server:dev
   
   # Terminal 2: Frontend  
   npm run client:dev
   ```

2. **Verify URLs in frontend code:**
   - Check that API calls use `http://localhost:3001`
   - Ensure no typos in endpoint URLs

3. **Test backend directly:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/v1/test
   ```

## Performance Issues

### Slow Development Server

**Solutions:**
1. **Exclude node_modules from file watchers**
2. **Increase Node.js memory limit:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```
3. **Use faster package manager:**
   ```bash
   # Install pnpm
   npm install -g pnpm
   
   # Use pnpm instead of npm
   pnpm install
   pnpm run dev
   ```

### Large Bundle Size

**Solutions:**
1. **Analyze bundle:**
   ```bash
   npm run build
   npx vite-bundle-analyzer dist
   ```

2. **Enable code splitting in Vite config**
3. **Remove unused dependencies**

## Best Practices for Avoiding Issues

### 1. Regular Maintenance
```bash
# Weekly cleanup
npm audit fix
npm update
rm -rf node_modules package-lock.json && npm install
```

### 2. Version Control
- Commit frequently
- Use meaningful commit messages
- Don't commit node_modules or .env files

### 3. Development Environment
- Use Node.js LTS version
- Keep your editor and extensions updated
- Use consistent line endings (LF)

### 4. TaskMaster AI Usage
- Always start fresh chats for new tasks
- Break down complex tasks before implementation
- Provide context with each task
- Test implementations before moving to next task

## Getting Help

If you're still experiencing issues:

1. **Check the GitHub Issues:** [TaskMaster Template Issues](https://github.com/villagaiaimpacthub/taskmaster-template/issues)
2. **Review the TaskMaster AI Documentation**
3. **Check your development environment setup**
4. **Verify all dependencies are correctly installed**

## Reporting Bugs

When reporting issues, please include:

1. **Error message** (full stack trace)
2. **Steps to reproduce**
3. **Your environment:**
   - OS version
   - Node.js version
   - npm/yarn version
   - Browser version (for frontend issues)
4. **Relevant configuration files** (package.json, .env template)

## Quick Diagnostic Commands

Run these to gather system information:

```bash
# System info
node --version
npm --version
git --version

# Project info
npm list --depth=0
npm run  # Shows available scripts

# Check ports
netstat -tulpn | grep :300  # Linux/macOS
netstat -ano | findstr :300  # Windows

# Check processes
ps aux | grep node  # Linux/macOS
tasklist | findstr node  # Windows
``` 