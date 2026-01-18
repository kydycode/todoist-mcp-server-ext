# Enhanced Todoist MCP Server Extended
[![smithery badge](https://smithery.ai/badge/@kydycode/todoist-mcp-server-ext)](https://smithery.ai/server/@kydycode/todoist-mcp-server-ext)

> **Extended Version** - Forked and enhanced by [kydycode](https://github.com/kydycode) from the original [@abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)

A comprehensive MCP (Model Context Protocol) server implementation that provides full integration between Claude and Todoist. This **extended version** includes additional features, improved compatibility, and enhanced functionality using the complete Todoist API with the latest MCP SDK (`@doist/todoist-api-typescript@4.0.4`).

## 🆕 Extended Version Features

### 🔧 **Technical Improvements**
* **Updated Todoist SDK**: Now using `@doist/todoist-api-typescript@4.0.4`.
* **Updated MCP SDK Compatibility**: Compatible with MCP SDK 0.5.0.
* **Enhanced Error Handling**: Comprehensive error handling with detailed error messages.
* **Improved TypeScript Support**: Better type safety and compatibility.
* **Optimized API Usage**: Efficient use of Todoist API, including `getTasksByFilter` for robust search and `moveTasks` for semantic task movement.
* **Better Response Formatting**: Enhanced task, project, and label formatting for better readability, including project names in search results.

### ✨ **Enhanced Task Management (11 Tools)**
* **Direct ID-based Operations**: Efficient task operations using task IDs.
* **Comprehensive Task Creation**: Support for subtasks, labels, projects, sections, priorities.
* **Quick Add Integration**: Natural language task creation using Todoist's Quick Add.
* **Advanced Task Search**: Robust keyword search using Todoist's filter engine (`search: your query`).
* **Task Movement Capabilities**: Move tasks between projects, sections, or make them subtasks.
* **Bulk Task Operations**: Move multiple tasks with subtasks in a single operation.
* **Task State Management**: Complete, reopen, and manage task lifecycle.
* **Detailed Task Output**: Search and get-task operations return more task details.

### 🗂️ **Complete Project Management (5 Tools)**
* **Full Project CRUD**: Create, read, update, delete projects with all properties.
* **Sub-project Support**: Create hierarchical project structures.
* **Project Customization**: Set colors, favorites, view styles (list/board).
* **Enhanced Project Listing**: Improved project retrieval with pagination and detailed formatting.

### 📋 **Section Management (4 Tools)**
* **Complete Section Operations**: Create, read, update, delete sections.
* **Project-specific Sections**: Filter and manage sections within projects.
* **Section Organization**: Proper ordering and structure management.

### 🏷️ **Label Management (5 Tools)**
* **Full Label CRUD**: Create, read, update, delete labels.
* **Label Customization**: Set names, colors, favorites, order.
* **Paginated Label Listing**: Efficiently retrieve all labels.

### 💬 **Comment Management (5 Tools)**
* **Complete Comment CRUD**: Create, read, update, delete comments on tasks and projects.
* **Attachment Support**: Add file attachments to comments with metadata.
* **Flexible Targeting**: Comments can be attached to either tasks or projects.
* **Paginated Comment Retrieval**: Efficiently browse through comment threads.

### ✅ **Completed Tasks History (1 Tool)** 🆕
* **Sync API Integration**: Access completed task history via Todoist Sync API.
* **Flexible Filtering**: Filter by project, date range (since/until).
* **Pagination Support**: Retrieve large histories with limit/offset.
* **Rich Metadata**: Shows project/section names, note counts, completion timestamps.

## 🛠️ Available Tools (Total 31)

### Task Operations (11 tools)
| Tool                      | Description                                                                         |
|---------------------------|-------------------------------------------------------------------------------------|
| `todoist_create_task`     | Create tasks with full options (subtasks, labels, projects, sections, priorities).  |
| `todoist_quick_add_task`  | Natural language task creation using Todoist's Quick Add syntax.                   |
| `todoist_get_tasks`       | Retrieve tasks with filtering (project, section, parent, label, IDs) and pagination. |
| `todoist_get_task`        | Get a specific task by its ID, with detailed information.                           |
| `todoist_update_task`     | Update task properties (content, description, due date, priority, labels).        |
| `todoist_delete_task`     | Delete task by ID.                                                                  |
| `todoist_complete_task`   | Mark task complete.                                                                 |
| `todoist_reopen_task`     | Reopen completed task.                                                              |
| `todoist_search_tasks`    | Search tasks using Todoist's filter engine (e.g., `search: keyword`).              |
| `todoist_move_task`       | Move a task to a different project, section, or make it a subtask.                  |
| `todoist_bulk_move_tasks` | Move multiple tasks with their subtasks to a project, section, or parent task.      |

### Project Operations (5 tools)
| Tool                       | Description                                                                   |
|----------------------------|-------------------------------------------------------------------------------|
| `todoist_get_projects`     | List all active projects with pagination support.                             |
| `todoist_get_project`      | Get a specific project by its ID.                                             |
| `todoist_create_project`   | Create new project (name, color, favorite, view style, sub-projects).         |
| `todoist_update_project`   | Update project properties.                                                    |
| `todoist_delete_project`   | Delete project by ID.                                                         |

### Section Operations (4 tools)
| Tool                       | Description                                                     |
|----------------------------|-----------------------------------------------------------------|
| `todoist_get_sections`     | List sections (all sections or project-specific).               |
| `todoist_create_section`   | Create section in project (name, project, ordering).            |
| `todoist_update_section`   | Update section name.                                            |
| `todoist_delete_section`   | Delete section by ID.                                           |

### Label Operations (5 tools)
| Tool                     | Description                                                        |
|--------------------------|--------------------------------------------------------------------|
| `todoist_create_label`   | Create a new label (name, color, favorite, order).               |
| `todoist_get_label`      | Get a specific label by its ID.                                    |
| `todoist_get_labels`     | List all labels with pagination support.                           |
| `todoist_update_label`   | Update an existing label by its ID (name, color, favorite, order). |
| `todoist_delete_label`   | Delete a label by its ID.                                          |

### Comment Operations (5 tools)
| Tool                       | Description                                                     |
|----------------------------|-----------------------------------------------------------------|
| `todoist_create_comment`   | Create a new comment on a task or project (with attachments).   |
| `todoist_get_comment`      | Get a specific comment by its ID.                               |
| `todoist_get_comments`     | Get comments for a task or project with pagination support.     |
| `todoist_update_comment`   | Update an existing comment by its ID.                           |
| `todoist_delete_comment`   | Delete a comment by its ID.                                     |

### Completed Tasks Operations (1 tool) 🆕
| Tool                           | Description                                                     |
|--------------------------------|-----------------------------------------------------------------|
| `todoist_get_completed_tasks`  | Get completed tasks history with filtering by project, date range (since/until), and pagination. Uses Todoist Sync API. |

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
      "args": ["/path/to/your/todoist-mcp-server-ext/dist/index.js"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

#### Option 2: Run via npm/npx (recommended for published version)
```json
{
  "mcpServers": {
    "todoist-mcp-server": {
      "command": "npx",
      "args": ["-y", "@kydycode/todoist-mcp-server-ext@latest"],
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
npm install -g @kydycode/todoist-mcp-server-ext@latest

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

### 🎯 Advanced Task Creation & Management
```
"Create task 'Team Meeting @Tomorrow #Work p1'"
"Add task 'Fix critical bug +KydyCode @DevProject L:Urgent L:Backend'"
"Quick add: 'Buy milk tomorrow at 2pm #shopping !p1'"
"Move task with ID {task_id} to project {project_id}"
"Search tasks: search: API deployment"
```

### 🗂️ Project, Section, Label, and Comment Management
```
"List all my projects"
"Create project 'Q2 Planning' color:blue favorite:true view:board"
"Get sections for project {project_id}"
"Create label 'HighPriority' color:red isFavorite:true"
"List all labels"
"Add comment 'Great progress on this task!' to task {task_id}"
"Get all comments for project {project_id}"
"Update comment {comment_id} with new content"
```

### ✅ Completed Tasks History 🆕
```
"Show my completed tasks"
"Get completed tasks from project {project_id}"
"Show tasks completed since 2024-01-01"
"Get completed tasks between 2024-01-01 and 2024-01-31"
"Show last 50 completed tasks"
```

## 🆚 Extended vs Original Comparison

| Feature                     | Original                             | Extended Version (`@kydycode/todoist-mcp-server-ext`) |
|-----------------------------|--------------------------------------|-------------------------------------------------------|
| **Todoist SDK Version**     | Older                                | ✅ `@doist/todoist-api-typescript@4.0.4`              |
| **MCP SDK Compatibility**   | Older version                        | ✅ Latest MCP SDK 0.5.0+                              |
| **Error Handling**          | Basic                                | ✅ Comprehensive with detailed messages               |
| **TypeScript Support**      | Limited                              | ✅ Full type safety                                   |
| **Task Operations**         | Search-based, limited features       | ✅ 11 Tools: Direct ID-based, `moveTasks`, bulk move, robust search, QuickAdd, full CRUD-like ops |
| **Project Management**      | Limited                              | ✅ 5 Tools: Full CRUD operations, sub-projects, pagination |
| **Section Management**      | Basic                                | ✅ 4 Tools: Complete section operations               |
| **Label Management**        | Not Available                        | ✅ 5 Tools: Full CRUD operations, pagination          |
| **Comment Management**      | Not Available                        | ✅ 5 Tools: Full CRUD operations, attachments, pagination |
| **Completed Tasks History** | Not Available                        | ✅ 1 Tool: Sync API integration, date filtering, pagination |
| **API Parameter Handling**  | Inconsistent                         | ✅ Proper parameter validation                          |
| **Response Formatting**     | Basic                                | ✅ Enhanced readability, more details                 |
| **Build System**            | Issues                               | ✅ Clean compilation                                  |
| **Search Functionality**    | Basic local filter                   | ✅ Robust `getTasksByFilter` (Todoist engine)         |

## 🔧 Development

### Project Structure
```
src/
├── index.ts          # Main server implementation with all tools
package.json      # Dependencies and scripts
tsconfig.json     # TypeScript configuration
README.md         # This file
local-instructions.md # Personal publishing guide
LICENSE
.gitignore
dist/             # Compiled JavaScript output (after `npm run build`)
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
# Example: Set token and pipe a list tools request
export TODOIST_API_TOKEN="your_actual_todoist_api_token"
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node dist/index.js
```

### Development Scripts
```bash
npm run build     # Compile TypeScript and make output executable
npm run watch     # Watch for changes and rebuild (doesn't make output executable)
npm run prepare   # Pre-publish build (runs build)
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
- **NPM Package**: [`@kydycode/todoist-mcp-server-ext`](https://www.npmjs.com/package/@kydycode/todoist-mcp-server-ext)
- **Original Repository**: [abhiz123/todoist-mcp-server](https://github.com/abhiz123/todoist-mcp-server)
- [Todoist API Documentation](https://developer.todoist.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)