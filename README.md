# Enhanced Todoist MCP Server Extended
[![smithery badge](https://smithery.ai/badge/@abhiz123/todoist-mcp-server)](https://smithery.ai/server/@abhiz123/todoist-mcp-server)

> **Extended Version** - Forked and enhanced by [kydycode](https://github.com/kydycode) from the original [@abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)

A comprehensive MCP (Model Context Protocol) server implementation that provides full integration between Claude and Todoist. This **extended version** includes additional features, improved compatibility, and enhanced functionality using the complete Todoist API with the latest MCP SDK.

<a href="https://glama.ai/mcp/servers/fhaif4fv1w">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/fhaif4fv1w/badge" alt="Todoist Server MCP server" />
</a>

## 🆕 Extended Version Features

### 🔧 **Technical Improvements**
* **Updated MCP SDK Compatibility**: Compatible with MCP SDK 0.5.0 and latest versions
* **Enhanced Error Handling**: Comprehensive error handling with detailed error messages
* **Improved TypeScript Support**: Better type safety and compatibility
* **Optimized API Usage**: Efficient use of Todoist API with proper parameter handling
* **Better Response Formatting**: Enhanced task and project formatting for better readability

### ✨ **Enhanced Task Management**
* **Direct ID-based Operations**: Efficient task operations using task IDs instead of search
* **Comprehensive Task Creation**: Support for subtasks, labels, projects, sections, priorities
* **Quick Add Integration**: Natural language task creation using Todoist's Quick Add
* **Advanced Task Search**: Content-based search with project scoping
* **Task Movement Capabilities**: Move tasks between projects, sections, or make them subtasks
* **Task State Management**: Complete, reopen, and manage task lifecycle
* **Smart Filtering**: Enhanced filtering with better parameter handling

### 🗂️ **Complete Project Management**
* **Full Project CRUD**: Create, read, update, delete projects with all properties
* **Sub-project Support**: Create hierarchical project structures
* **Project Customization**: Set colors, favorites, view styles (list/board)
* **Enhanced Project Listing**: Improved project retrieval and formatting

### 📋 **Section Management**
* **Complete Section Operations**: Create, read, update, delete sections
* **Project-specific Sections**: Filter and manage sections within projects
* **Section Organization**: Proper ordering and structure management

## 🛠️ Available Tools

### Task Operations (10 tools)
| Tool | Description | Enhanced Features |
|------|-------------|------------------|
| `todoist_create_task` | Create tasks with full options | ✅ Subtasks, labels, projects, sections, priorities |
| `todoist_quick_add_task` | Natural language task creation | ✅ Todoist Quick Add syntax support |
| `todoist_get_tasks` | Retrieve tasks with filtering | ✅ Project, section, parent, label filtering |
| `todoist_get_task` | Get specific task by ID | ✅ Direct ID-based retrieval |
| `todoist_update_task` | Update task properties | ✅ Content, description, due date, priority, labels |
| `todoist_delete_task` | Delete task by ID | ✅ Direct deletion with confirmation |
| `todoist_complete_task` | Mark task complete | ✅ Instant completion |
| `todoist_reopen_task` | Reopen completed task | ✅ Task restoration |
| `todoist_search_tasks` | Search tasks by content | ✅ Project-scoped content search |

### Project Operations (5 tools)
| Tool | Description | Enhanced Features |
|------|-------------|------------------|
| `todoist_get_projects` | List all active projects | ✅ Clean formatting, proper error handling |
| `todoist_get_project` | Get specific project by ID | ✅ Direct project retrieval |
| `todoist_create_project` | Create new project | ✅ Name, color, favorite, view style, sub-projects |
| `todoist_update_project` | Update project properties | ✅ All project attributes |
| `todoist_delete_project` | Delete project by ID | ✅ Safe deletion with confirmation |

### Section Operations (4 tools)
| Tool | Description | Enhanced Features |
|------|-------------|------------------|
| `todoist_get_sections` | List sections | ✅ All sections or project-specific |
| `todoist_create_section` | Create section in project | ✅ Name, project, ordering |
| `todoist_update_section` | Update section name | ✅ Direct section modification |
| `todoist_delete_section` | Delete section by ID | ✅ Clean section removal |

## 🚀 Installation & Setup

### Local Development Setup

```bash
# Clone the extended repository
git clone https://github.com/kydycode/todoist-mcp-server-ext.git
cd todoist-mcp-server-ext

# Install dependencies
npm install

# Build the project
npm run build
```

### Getting a Todoist API Token
1. Log in to your Todoist account
2. Navigate to Settings → Integrations → Developer
3. Copy your API token

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

#### Option 1: Run locally built version
```json
{
  "mcpServers": {
    "todoist-mcp-server": {
      "command": "node",
      "args": ["/path/to/todoist-mcp-server-ext/dist/index.js"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

#### Option 2: Run via npm (if installed globally)
```json
{
  "mcpServers": {
    "todoist-mcp-server": {
      "command": "npx",
      "args": ["-y", "@kydycode/todoist-mcp-server-ext"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

#### Option 3: Install globally first
```bash
# Install the extended version globally
npm install -g @kydycode/todoist-mcp-server-ext

# Then use in Claude Desktop config
{
  "mcpServers": {
    "todoist-mcp-server": {
      "command": "todoist-mcp-server-ext",
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## 📖 Usage Examples

### 🎯 Advanced Task Creation
```
"Create task 'Team Meeting' in project 'Work'"
"Add high priority task 'Fix critical bug' with labels 'urgent' and 'backend'"
"Quick add: 'Buy milk tomorrow at 2pm #shopping !p1'"
"Create subtask 'Prepare agenda' under existing task"
```

### 🔍 Task Management & Search
```
"Get all tasks in project 'Work'"
"Search for tasks containing 'meeting'"
"Show task details for specific task ID"
"Update task priority to urgent"
"Complete task and then reopen it"
```

### 🗂️ Project Organization
```
"List all my projects"
"Create project 'Q1 Planning' with blue color and board view"
"Create sub-project 'Marketing' under 'Business'"
"Update project to favorite"
"Get specific project details"
```

### 📋 Section Management
```
"Create section 'In Progress' in Development project"
"List all sections in Work project"
"Update section name to 'Completed'"
"Delete empty section"
```

## 🆚 Extended vs Original Comparison

| Feature | Original | Extended Version |
|---------|----------|------------------|
| **MCP SDK Compatibility** | Older version | ✅ Latest MCP SDK 0.5.0+ |
| **Error Handling** | Basic | ✅ Comprehensive with detailed messages |
| **TypeScript Support** | Limited | ✅ Full type safety |
| **Task Operations** | Search-based | ✅ Direct ID-based + Search fallback |
| **Project Management** | Limited | ✅ Full CRUD operations |
| **Section Management** | Basic | ✅ Complete section operations |
| **API Parameter Handling** | Inconsistent | ✅ Proper parameter validation |
| **Response Formatting** | Basic | ✅ Enhanced readability |
| **Build System** | Issues | ✅ Clean compilation |

## 🔧 Development

### Project Structure
```
src/
├── index.ts          # Main server implementation with all tools
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── dist/            # Compiled JavaScript output
    ├── index.js
    └── index.d.ts
```

### Building from Source
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test the server (requires TODOIST_API_TOKEN)
TODOIST_API_TOKEN=your_token node dist/index.js
```

### Development Scripts
```bash
npm run build     # Compile TypeScript
npm run watch     # Watch for changes and rebuild
npm run prepare   # Pre-publish build
```

## 🤝 Contributing

Contributions are welcome! This extended version accepts contributions for:

- Additional Todoist API endpoints
- Enhanced error handling and validation
- Performance optimizations
- Documentation improvements
- Bug fixes and compatibility updates

Please submit issues and pull requests to the [extended repository](https://github.com/kydycode/todoist-mcp-server-ext).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Extended Version**: [kydycode](https://github.com/kydycode) - Enhanced functionality and compatibility
- **Original Creator**: [@abhiz123](https://github.com/abhiz123) - Initial Todoist MCP server implementation
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic

## 🐛 Issues and Support

- **Extended Version Issues**: [GitHub Issues](https://github.com/kydycode/todoist-mcp-server-ext/issues)
- **Original Repository**: [abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)

## 🔗 Related Links

- **Extended Repository**: [kydycode/todoist-mcp-server-ext](https://github.com/kydycode/todoist-mcp-server-ext)
- **Original Repository**: [abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)
- [Todoist API Documentation](https://developer.todoist.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)