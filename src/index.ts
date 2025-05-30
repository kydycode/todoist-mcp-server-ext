#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Check for API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client
const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

// Enhanced Task Tools
const CREATE_TASK_TOOL: Tool = {
  name: "todoist_create_task",
  description: "Create a new task in Todoist with comprehensive options including subtasks",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the task"
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)"
      },
      projectId: {
        type: "string",
        description: "Project ID to create the task in (optional)"
      },
      sectionId: {
        type: "string",
        description: "Section ID to create the task in (optional)"
      },
      parentId: {
        type: "string",
        description: "Parent task ID to create this as a subtask (optional)"
      },
      dueString: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to assign to the task (optional)"
      }
    },
    required: ["content"]
  }
};

const QUICK_ADD_TASK_TOOL: Tool = {
  name: "todoist_quick_add_task",
  description: "Create a task using Todoist's Quick Add feature with natural language parsing",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Natural language text for quick task creation (e.g., 'Buy milk tomorrow at 2pm #shopping')"
      },
      note: {
        type: "string",
        description: "Additional note for the task (optional)"
      },
      reminder: {
        type: "string",
        description: "Reminder time (optional)"
      }
    },
    required: ["text"]
  }
};

const GET_TASKS_TOOL: Tool = {
  name: "todoist_get_tasks",
  description: "Get tasks with comprehensive filtering and pagination support",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Filter tasks by project ID (optional)"
      },
      sectionId: {
        type: "string",
        description: "Filter tasks by section ID (optional)"
      },
      parentId: {
        type: "string",
        description: "Filter tasks by parent ID (get subtasks) (optional)"
      },
      label: {
        type: "string",
        description: "Filter tasks by label name (optional)"
      },
      ids: {
        type: "array",
        items: { type: "string" },
        description: "Array of task IDs to retrieve (optional)"
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page (optional)"
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (default: 50, max: 200) (optional)",
        default: 50
      }
    }
  }
};

const GET_TASK_TOOL: Tool = {
  name: "todoist_get_task",
  description: "Get a specific task by its ID",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the task to retrieve"
      }
    },
    required: ["taskId"]
  }
};

const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_update_task",
  description: "Update an existing task by its ID",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the task to update"
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)"
      },
      description: {
        type: "string",
        description: "New description for the task (optional)"
      },
      dueString: {
        type: "string",
        description: "New due date in natural language (optional)"
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "New array of label names (optional)"
      }
    },
    required: ["taskId"]
  }
};

const DELETE_TASK_TOOL: Tool = {
  name: "todoist_delete_task",
  description: "Delete a task by its ID",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the task to delete"
      }
    },
    required: ["taskId"]
  }
};

const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_complete_task",
  description: "Mark a task as complete by its ID",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the task to complete"
      }
    },
    required: ["taskId"]
  }
};

const REOPEN_TASK_TOOL: Tool = {
  name: "todoist_reopen_task",
  description: "Reopen a completed task by its ID",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the completed task to reopen"
      }
    },
    required: ["taskId"]
  }
};

// Project Management Tools
const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_get_projects",
  description: "Get all active projects with pagination support",
  inputSchema: {
    type: "object",
    properties: {
      cursor: {
        type: "string",
        description: "Pagination cursor for next page (optional)"
      },
      limit: {
        type: "number",
        description: "Maximum number of projects to return (default: 50, max: 200) (optional)",
        default: 50
      }
    }
  }
};

const GET_PROJECT_TOOL: Tool = {
  name: "todoist_get_project",
  description: "Get a specific project by its ID",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The ID of the project to retrieve"
      }
    },
    required: ["projectId"]
  }
};

const CREATE_PROJECT_TOOL: Tool = {
  name: "todoist_create_project",
  description: "Create a new project",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the project"
      },
      parentId: {
        type: "string",
        description: "Parent project ID for creating a sub-project (optional)"
      },
      color: {
        type: "string",
        description: "Project color (optional)"
      },
      isFavorite: {
        type: "boolean",
        description: "Whether to mark as favorite (optional)"
      },
      viewStyle: {
        type: "string",
        description: "Project view style: 'list' or 'board' (optional)",
        enum: ["list", "board"]
      }
    },
    required: ["name"]
  }
};

const UPDATE_PROJECT_TOOL: Tool = {
  name: "todoist_update_project",
  description: "Update an existing project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The ID of the project to update"
      },
      name: {
        type: "string",
        description: "New name for the project (optional)"
      },
      color: {
        type: "string",
        description: "New color for the project (optional)"
      },
      isFavorite: {
        type: "boolean",
        description: "Whether to mark as favorite (optional)"
      },
      viewStyle: {
        type: "string",
        description: "Project view style: 'list' or 'board' (optional)",
        enum: ["list", "board"]
      }
    },
    required: ["projectId"]
  }
};

const DELETE_PROJECT_TOOL: Tool = {
  name: "todoist_delete_project",
  description: "Delete a project by its ID",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The ID of the project to delete"
      }
    },
    required: ["projectId"]
  }
};

// Section Management Tools
const GET_SECTIONS_TOOL: Tool = {
  name: "todoist_get_sections",
  description: "Get all sections or sections for a specific project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Filter sections by project ID (optional)"
      }
    }
  }
};

const CREATE_SECTION_TOOL: Tool = {
  name: "todoist_create_section",
  description: "Create a new section in a project",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the section"
      },
      projectId: {
        type: "string",
        description: "The project ID where the section will be created"
      },
      order: {
        type: "number",
        description: "Order of the section (optional)"
      }
    },
    required: ["name", "projectId"]
  }
};

const UPDATE_SECTION_TOOL: Tool = {
  name: "todoist_update_section",
  description: "Update an existing section",
  inputSchema: {
    type: "object",
    properties: {
      sectionId: {
        type: "string",
        description: "The ID of the section to update"
      },
      name: {
        type: "string",
        description: "New name for the section"
      }
    },
    required: ["sectionId", "name"]
  }
};

const DELETE_SECTION_TOOL: Tool = {
  name: "todoist_delete_section",
  description: "Delete a section by its ID",
  inputSchema: {
    type: "object",
    properties: {
      sectionId: {
        type: "string",
        description: "The ID of the section to delete"
      }
    },
    required: ["sectionId"]
  }
};

// Search Tool
const SEARCH_TASKS_TOOL: Tool = {
  name: "todoist_search_tasks",
  description: "Search for tasks by content/name (fallback for when ID is not known)",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query to find tasks by content"
      },
      projectId: {
        type: "string",
        description: "Limit search to specific project (optional)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 10) (optional)",
        default: 10
      }
    },
    required: ["query"]
  }
};

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server-enhanced",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Helper function to format task output
function formatTask(task: any): string {
  return `- ${task.content}${task.description ? `\n  Description: ${task.description}` : ''}${task.due ? `\n  Due: ${task.due.string}` : ''}${task.priority && task.priority > 1 ? `\n  Priority: ${task.priority}` : ''}${task.labels && task.labels.length > 0 ? `\n  Labels: ${task.labels.join(', ')}` : ''}${task.parentId ? `\n  Parent: ${task.parentId}` : ''}`;
}

// Helper function to format project output
function formatProject(project: any): string {
  return `- ${project.name}${project.color ? `\n  Color: ${project.color}` : ''}${project.isFavorite ? `\n  Favorite: Yes` : ''}${project.viewStyle ? `\n  View: ${project.viewStyle}` : ''}${project.parentId ? `\n  Parent: ${project.parentId}` : ''}`;
}

// Type guards for arguments
function isCreateTaskArgs(args: unknown): args is { 
  content: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  dueString?: string;
  priority?: number;
  labels?: string[];
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

function isQuickAddArgs(args: unknown): args is {
  text: string;
  note?: string;
  reminder?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "text" in args &&
    typeof (args as { text: string }).text === "string"
  );
}

function isGetTasksArgs(args: unknown): args is { 
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  label?: string;
  ids?: string[];
  cursor?: string;
  limit?: number;
} {
  return typeof args === "object" && args !== null;
}

function isTaskIdArgs(args: unknown): args is {
  taskId: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "taskId" in args &&
    typeof (args as { taskId: string }).taskId === "string"
  );
}

function isUpdateTaskArgs(args: unknown): args is {
  taskId: string;
  content?: string;
  description?: string;
  dueString?: string;
  priority?: number;
  labels?: string[];
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "taskId" in args &&
    typeof (args as { taskId: string }).taskId === "string"
  );
}

function isProjectArgs(args: unknown): args is {
  cursor?: string;
  limit?: number;
} {
  return typeof args === "object" && args !== null;
}

function isProjectIdArgs(args: unknown): args is {
  projectId: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "projectId" in args &&
    typeof (args as { projectId: string }).projectId === "string"
  );
}

function isCreateProjectArgs(args: unknown): args is {
  name: string;
  parentId?: string;
  color?: string;
  isFavorite?: boolean;
  viewStyle?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isUpdateProjectArgs(args: unknown): args is {
  projectId: string;
  name?: string;
  color?: string;
  isFavorite?: boolean;
  viewStyle?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "projectId" in args &&
    typeof (args as { projectId: string }).projectId === "string"
  );
}

function isSectionArgs(args: unknown): args is {
  projectId?: string;
} {
  return typeof args === "object" && args !== null;
}

function isCreateSectionArgs(args: unknown): args is {
  name: string;
  projectId: string;
  order?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    "projectId" in args &&
    typeof (args as { name: string; projectId: string }).name === "string" &&
    typeof (args as { name: string; projectId: string }).projectId === "string"
  );
}

function isUpdateSectionArgs(args: unknown): args is {
  sectionId: string;
  name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "sectionId" in args &&
    "name" in args &&
    typeof (args as { sectionId: string; name: string }).sectionId === "string" &&
    typeof (args as { sectionId: string; name: string }).name === "string"
  );
}

function isSectionIdArgs(args: unknown): args is {
  sectionId: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "sectionId" in args &&
    typeof (args as { sectionId: string }).sectionId === "string"
  );
}

function isSearchTasksArgs(args: unknown): args is {
  query: string;
  projectId?: string;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "query" in args &&
    typeof (args as { query: string }).query === "string"
  );
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Task tools
    CREATE_TASK_TOOL,
    QUICK_ADD_TASK_TOOL,
    GET_TASKS_TOOL,
    GET_TASK_TOOL,
    UPDATE_TASK_TOOL,
    DELETE_TASK_TOOL,
    COMPLETE_TASK_TOOL,
    REOPEN_TASK_TOOL,
    SEARCH_TASKS_TOOL,
    // Project tools
    GET_PROJECTS_TOOL,
    GET_PROJECT_TOOL,
    CREATE_PROJECT_TOOL,
    UPDATE_PROJECT_TOOL,
    DELETE_PROJECT_TOOL,
    // Section tools
    GET_SECTIONS_TOOL,
    CREATE_SECTION_TOOL,
    UPDATE_SECTION_TOOL,
    DELETE_SECTION_TOOL,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    // Task operations
    if (name === "todoist_create_task") {
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_task");
      }
      const taskData: any = {
        content: args.content,
      };
      if (args.description) taskData.description = args.description;
      if (args.projectId) taskData.projectId = args.projectId;
      if (args.sectionId) taskData.sectionId = args.sectionId;
      if (args.parentId) taskData.parentId = args.parentId;
      if (args.dueString) taskData.dueString = args.dueString;
      if (args.priority) taskData.priority = args.priority;
      if (args.labels && args.labels.length > 0) taskData.labels = args.labels;

      const task = await todoistClient.addTask(taskData);
      return {
        content: [{ 
          type: "text", 
          text: `Task created successfully:\nID: ${task.id}\n${formatTask(task)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_quick_add_task") {
      if (!isQuickAddArgs(args)) {
        throw new Error("Invalid arguments for todoist_quick_add_task");
      }
      
      const quickAddData: any = { text: args.text };
      if (args.note) quickAddData.note = args.note;
      if (args.reminder) quickAddData.reminder = args.reminder;

      const result = await todoistClient.quickAddTask(quickAddData);
      return {
        content: [{ 
          type: "text", 
          text: `Task created via Quick Add:\n${JSON.stringify(result, null, 2)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_tasks") {
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_tasks");
      }
      
      const params: any = {};
      if (args.projectId) params.projectId = args.projectId;
      if (args.sectionId) params.sectionId = args.sectionId;
      if (args.parentId) params.parentId = args.parentId;
      if (args.label) params.label = args.label;
      if (args.ids && args.ids.length > 0) params.ids = args.ids;
      if (args.cursor) params.cursor = args.cursor;
      if (args.limit) params.limit = args.limit;

      const tasks = await todoistClient.getTasks(Object.keys(params).length > 0 ? params : {});
      
      // Handle both array and paginated response formats
      let taskList: string;
      let nextCursor: string = '';
      
      if (Array.isArray(tasks)) {
        taskList = tasks.map(formatTask).join('\n\n');
      } else {
        const paginatedTasks = tasks as any;
        taskList = paginatedTasks.results?.map(formatTask).join('\n\n') || 'No tasks found';
        nextCursor = paginatedTasks.nextCursor ? `\n\nNext cursor: ${paginatedTasks.nextCursor}` : '';
      }
      
      return {
        content: [{ 
          type: "text", 
          text: `Tasks:\n${taskList}${nextCursor}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_task") {
      if (!isTaskIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_task");
      }

      const task = await todoistClient.getTask(args.taskId);
      return {
        content: [{ 
          type: "text", 
          text: `Task details:\nID: ${task.id}\n${formatTask(task)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_task") {
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task");
      }

      const updateData: any = {};
      if (args.content) updateData.content = args.content;
      if (args.description) updateData.description = args.description;
      if (args.dueString) updateData.dueString = args.dueString;
      if (args.priority) updateData.priority = args.priority;
      if (args.labels) updateData.labels = args.labels;

      const updatedTask = await todoistClient.updateTask(args.taskId, updateData);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task updated successfully:\nID: ${updatedTask.id}\n${formatTask(updatedTask)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_task") {
      if (!isTaskIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_task");
      }

      await todoistClient.deleteTask(args.taskId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task ${args.taskId} deleted successfully` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_complete_task") {
      if (!isTaskIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_complete_task");
      }

      await todoistClient.closeTask(args.taskId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task ${args.taskId} completed successfully` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_reopen_task") {
      if (!isTaskIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_reopen_task");
      }

      await todoistClient.reopenTask(args.taskId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task ${args.taskId} reopened successfully` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_search_tasks") {
      if (!isSearchTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_search_tasks");
      }

      const params: any = {};
      if (args.projectId) params.projectId = args.projectId;
      
      const tasks = await todoistClient.getTasks(params);
      const allTasks = Array.isArray(tasks) ? tasks : (tasks as any).results || [];
      
      const matchingTasks = allTasks.filter((task: any) => 
        task.content.toLowerCase().includes(args.query.toLowerCase())
      ).slice(0, args.limit || 10);

      if (matchingTasks.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `No tasks found matching "${args.query}"` 
          }],
          isError: false,
        };
      }

      const taskList = matchingTasks.map((task: any) => 
        `ID: ${task.id}\n${formatTask(task)}`
      ).join('\n\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Found ${matchingTasks.length} task(s) matching "${args.query}":\n\n${taskList}` 
        }],
        isError: false,
      };
    }

    // Project operations
    if (name === "todoist_get_projects") {
      if (!isProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_projects");
      }
      
      const params: any = {};
      if (args.cursor) params.cursor = args.cursor;
      if (args.limit) params.limit = args.limit;

      // Note: getProjects() may not accept parameters in this API version
      const projects = await todoistClient.getProjects();
      
      // Handle simple array response
      const projectList = Array.isArray(projects) 
        ? projects.map(formatProject).join('\n\n')
        : 'No projects found';
      
      return {
        content: [{ 
          type: "text", 
          text: `Projects:\n${projectList}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_project") {
      if (!isProjectIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_project");
      }

      const project = await todoistClient.getProject(args.projectId);
      return {
        content: [{ 
          type: "text", 
          text: `Project details:\nID: ${project.id}\n${formatProject(project)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_project") {
      if (!isCreateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_project");
      }
      
      const projectData: any = { name: args.name };
      if (args.parentId) projectData.parentId = args.parentId;
      if (args.color) projectData.color = args.color;
      if (args.isFavorite !== undefined) projectData.isFavorite = args.isFavorite;
      if (args.viewStyle) projectData.viewStyle = args.viewStyle;

      const project = await todoistClient.addProject(projectData);
      return {
        content: [{ 
          type: "text", 
          text: `Project created successfully:\nID: ${project.id}\n${formatProject(project)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_project") {
      if (!isUpdateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_project");
      }

      const updateData: any = {};
      if (args.name) updateData.name = args.name;
      if (args.color) updateData.color = args.color;
      if (args.isFavorite !== undefined) updateData.isFavorite = args.isFavorite;
      if (args.viewStyle) updateData.viewStyle = args.viewStyle;

      const updatedProject = await todoistClient.updateProject(args.projectId, updateData);
      
      return {
        content: [{ 
          type: "text", 
          text: `Project updated successfully:\nID: ${updatedProject.id}\n${formatProject(updatedProject)}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_project") {
      if (!isProjectIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_project");
      }

      await todoistClient.deleteProject(args.projectId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Project ${args.projectId} deleted successfully` 
        }],
        isError: false,
      };
    }

    // Section operations
    if (name === "todoist_get_sections") {
      if (!isSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_sections");
      }
      
      const params: any = {};
      if (args.projectId) params.projectId = args.projectId;

      const sections = await todoistClient.getSections(Object.keys(params).length > 0 ? params : {});
      // Handle simple array response
      const sectionResults = Array.isArray(sections) ? sections : [];
      const sectionList = sectionResults.map((section: any) => 
        `- ${section.name} (ID: ${section.id}, Project: ${section.projectId})`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Sections:\n${sectionList || 'No sections found'}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_section") {
      if (!isCreateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_section");
      }
      
      const sectionData: any = { 
        name: args.name, 
        projectId: args.projectId 
      };
      if (args.order !== undefined) sectionData.order = args.order;

      const section = await todoistClient.addSection(sectionData);
      return {
        content: [{ 
          type: "text", 
          text: `Section created successfully:\nID: ${section.id}\nName: ${section.name}\nProject: ${section.projectId}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_section") {
      if (!isUpdateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_section");
      }

      const updatedSection = await todoistClient.updateSection(args.sectionId, { name: args.name });
      
      return {
        content: [{ 
          type: "text", 
          text: `Section updated successfully:\nID: ${updatedSection.id}\nName: ${updatedSection.name}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_section") {
      if (!isSectionIdArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_section");
      }

      await todoistClient.deleteSection(args.sectionId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Section ${args.sectionId} deleted successfully` 
        }],
        isError: false,
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enhanced Todoist MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});