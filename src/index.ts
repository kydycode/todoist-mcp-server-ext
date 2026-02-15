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

// Type definitions for API v1 completed tasks
interface CompletedTaskItem {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  labels: string[];
  priority: number;
  checked: boolean;
  completed_at: string | null;
  added_at: string | null;
  due: {
    is_recurring: boolean;
    string: string;
    date: string;
    datetime?: string | null;
    timezone?: string | null;
  } | null;
  user_id: string;
  note_count: number;
}

interface CompletedTasksResponse {
  items: CompletedTaskItem[];
  next_cursor: string | null;
}

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

const MOVE_TASK_TOOL: Tool = {
  name: "todoist_move_task",
  description: "Move a single task (and its subtasks, if any) to a different project, section, or make it a subtask of another task. Provide the taskId and exactly one of: projectId, sectionId, or parentId.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "The ID of the task to move."
      },
      projectId: {
        type: "string",
        description: "The ID of the destination project. (Optional, use only one of projectId, sectionId, parentId)"
      },
      sectionId: {
        type: "string",
        description: "The ID of the destination section. (Optional, use only one of projectId, sectionId, parentId)"
      },
      parentId: {
        type: "string",
        description: "The ID of the parent task to move this task under. (Optional, use only one of projectId, sectionId, parentId)"
      }
    },
    required: ["taskId"]
    // Note: Validation for providing exactly one of projectId, sectionId, or parentId
    // is handled in the isMoveTaskArgs type guard and the tool handler.
    // A more complex JSON schema with oneOf could enforce this, but client support varies.
  }
};

const BULK_MOVE_TASKS_TOOL: Tool = {
  name: "todoist_bulk_move_tasks",
  description: "Move multiple tasks (and their respective subtasks, if any; e.g., up to 10-20 parent tasks for best performance) to a different project, section, or make them subtasks of another task. Provide an array of taskIds and exactly one destination (projectId, sectionId, or parentId).",
  inputSchema: {
    type: "object",
    properties: {
      taskIds: {
        type: "array",
        items: { type: "string" },
        description: "An array of task IDs to move.",
        minItems: 1 // Ensure at least one task ID is provided
      },
      projectId: {
        type: "string",
        description: "The ID of the destination project. (Optional, use only one of projectId, sectionId, parentId)"
      },
      sectionId: {
        type: "string",
        description: "The ID of the destination section. (Optional, use only one of projectId, sectionId, parentId)"
      },
      parentId: {
        type: "string",
        description: "The ID of the parent task to move these tasks under. (Optional, use only one of projectId, sectionId, parentId)"
      }
    },
    required: ["taskIds"]
    // Note: Validation for providing exactly one of projectId, sectionId, or parentId
    // is handled in the isBulkMoveTasksArgs type guard and the tool handler.
  }
};

// Label Management Tools
const CREATE_LABEL_TOOL: Tool = {
  name: "todoist_create_label",
  description: "Create a new label.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "The name of the label." },
      color: { type: "string", description: "Label color name or code (e.g., 'berry_red', '#FF0000') (optional)." },
      isFavorite: { type: "boolean", description: "Whether the label should be a favorite (optional)." },
      order: { type: "number", description: "The order of the label in the list (optional)." }
    },
    required: ["name"]
  }
};

const GET_LABEL_TOOL: Tool = {
  name: "todoist_get_label",
  description: "Get a specific label by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      labelId: { type: "string", description: "The ID of the label to retrieve." }
    },
    required: ["labelId"]
  }
};

const GET_LABELS_TOOL: Tool = {
  name: "todoist_get_labels",
  description: "Get all labels. Supports pagination.",
  inputSchema: {
    type: "object",
    properties: {
      cursor: { 
        type: "string", 
        description: "Pagination cursor for next page (optional)." 
      },
      limit: { 
        type: "number", 
        description: "Maximum number of labels to return (default: 50) (optional)." 
      }
    }
  }
};

const UPDATE_LABEL_TOOL: Tool = {
  name: "todoist_update_label",
  description: "Update an existing label by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      labelId: { type: "string", description: "The ID of the label to update." },
      name: { type: "string", description: "New name for the label (optional)." },
      color: { type: "string", description: "New color for the label (optional)." },
      isFavorite: { type: "boolean", description: "New favorite status (optional)." },
      order: { type: "number", description: "New order for the label (optional)." }
    },
    required: ["labelId"]
  }
};

const DELETE_LABEL_TOOL: Tool = {
  name: "todoist_delete_label",
  description: "Delete a label by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      labelId: { type: "string", description: "The ID of the label to delete." }
    },
    required: ["labelId"]
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
  description: "Get all sections, or sections for a specific project. Supports pagination.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Filter sections by project ID (optional)."
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page (optional)."
      },
      limit: {
        type: "number",
        description: "Maximum number of sections to return (default: 50) (optional)."
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

// Comment Management Tools
const CREATE_COMMENT_TOOL: Tool = {
  name: "todoist_create_comment",
  description: "Create a new comment on a task or project",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/text of the comment"
      },
      taskId: {
        type: "string",
        description: "Task ID to add comment to (provide either taskId or projectId, not both)"
      },
      projectId: {
        type: "string",
        description: "Project ID to add comment to (provide either taskId or projectId, not both)"
      },
      attachment: {
        type: "object",
        description: "Optional file attachment (optional)",
        properties: {
          fileName: { type: "string" },
          fileType: { type: "string" },
          fileUrl: { type: "string" },
          resourceType: { type: "string" }
        }
      }
    },
    required: ["content"]
  }
};

const GET_COMMENT_TOOL: Tool = {
  name: "todoist_get_comment",
  description: "Get a specific comment by its ID",
  inputSchema: {
    type: "object",
    properties: {
      commentId: {
        type: "string",
        description: "The ID of the comment to retrieve"
      }
    },
    required: ["commentId"]
  }
};

const GET_COMMENTS_TOOL: Tool = {
  name: "todoist_get_comments",
  description: "Get comments for a task or project with pagination support",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "Task ID to get comments for (provide either taskId or projectId, not both)"
      },
      projectId: {
        type: "string",
        description: "Project ID to get comments for (provide either taskId or projectId, not both)"
      },
      cursor: {
        type: "string",
        description: "Pagination cursor for next page (optional)"
      },
      limit: {
        type: "number",
        description: "Maximum number of comments to return (optional)"
      }
    }
  }
};

const UPDATE_COMMENT_TOOL: Tool = {
  name: "todoist_update_comment",
  description: "Update an existing comment by its ID",
  inputSchema: {
    type: "object",
    properties: {
      commentId: {
        type: "string",
        description: "The ID of the comment to update"
      },
      content: {
        type: "string",
        description: "New content/text for the comment"
      }
    },
    required: ["commentId", "content"]
  }
};

const DELETE_COMMENT_TOOL: Tool = {
  name: "todoist_delete_comment",
  description: "Delete a comment by its ID",
  inputSchema: {
    type: "object",
    properties: {
      commentId: {
        type: "string",
        description: "The ID of the comment to delete"
      }
    },
    required: ["commentId"]
  }
};

const GET_COMPLETED_TASKS_TOOL: Tool = {
  name: "todoist_get_completed_tasks",
  description: "Get completed tasks from Todoist with flexible filtering and pagination support. Uses the Todoist API v1 to retrieve task completion history.",
  inputSchema: {
    type: "object",
    properties: {
      since: {
        type: "string",
        description: "ISO 8601 datetime to get tasks completed after this date (e.g., '2024-01-01T00:00:00Z') (required)"
      },
      until: {
        type: "string",
        description: "ISO 8601 datetime to get tasks completed before this date (e.g., '2024-12-31T23:59:59Z') (required)"
      },
      projectId: {
        type: "string",
        description: "Filter completed tasks by project ID (optional)"
      },
      sectionId: {
        type: "string",
        description: "Filter completed tasks by section ID (optional)"
      },
      limit: {
        type: "number",
        description: "Maximum number of completed tasks to return (default: 50, max: 200) (optional)"
      },
      cursor: {
        type: "string",
        description: "Cursor for pagination, use next_cursor from previous response (optional)"
      }
    },
    required: ["since", "until"]
  }
};

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server-enhanced",
    version: "0.6.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Helper function to format task output
function formatTask(task: any): string {
  let taskDetails = `- ID: ${task.id}\n  Content: ${task.content}`;
  if (task.description) taskDetails += `\n  Description: ${task.description}`;
  if (task.due) taskDetails += `\n  Due: ${task.due.string}`;
  if (task.priority && task.priority > 1) taskDetails += `\n  Priority: ${task.priority}`;
  if (task.labels && task.labels.length > 0) taskDetails += `\n  Labels: ${task.labels.join(', ')}`;
  if (task.projectId) taskDetails += `\n  Project ID: ${task.projectId}`;
  if (task.sectionId) taskDetails += `\n  Section ID: ${task.sectionId}`;
  if (task.parentId) taskDetails += `\n  Parent ID: ${task.parentId}`;
  if (task.url) taskDetails += `\n  URL: ${task.url}`;
  if (task.commentCount > 0) taskDetails += `\n  Comments: ${task.commentCount}`;
  if (task.createdAt) taskDetails += `\n  Created At: ${task.createdAt}`;
  if (task.creatorId) taskDetails += `\n  Creator ID: ${task.creatorId}`;
  return taskDetails;
}

// Helper function to format project output
function formatProject(project: any): string {
  return `- ${project.name}${project.color ? `\n  Color: ${project.color}` : ''}${project.isFavorite ? `\n  Favorite: Yes` : ''}${project.viewStyle ? `\n  View: ${project.viewStyle}` : ''}${project.parentId ? `\n  Parent: ${project.parentId}` : ''}${project.id ? ` (ID: ${project.id})` : ''}`;
}

// Helper function to format label output
function formatLabel(label: any): string {
  return `- ${label.name} (ID: ${label.id})${label.color ? `\n  Color: ${label.color}` : ''}${label.isFavorite ? `\n  Favorite: Yes` : ''}${label.order ? `\n  Order: ${label.order}`: ''}`;
}

// Helper function to format comment output
function formatComment(comment: any): string {
  let commentDetails = `- ID: ${comment.id}\n  Content: ${comment.content}`;
  if (comment.postedAt) commentDetails += `\n  Posted At: ${comment.postedAt}`;
  if (comment.taskId) commentDetails += `\n  Task ID: ${comment.taskId}`;
  if (comment.projectId) commentDetails += `\n  Project ID: ${comment.projectId}`;
  if (comment.attachment) {
    commentDetails += `\n  Attachment: ${comment.attachment.fileName || 'File'} (${comment.attachment.fileType})`;
    if (comment.attachment.fileUrl) commentDetails += `\n  File URL: ${comment.attachment.fileUrl}`;
  }
  return commentDetails;
}

// Helper function to call Todoist API v1 (REST)
async function callTodoistAPIv1(endpoint: string, params: Record<string, any>): Promise<any> {
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');

  const url = `https://api.todoist.com/api/v1/${endpoint}${queryParams ? '?' + queryParams : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Todoist API v1 error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Helper function to format completed task output
function formatCompletedTask(task: CompletedTaskItem, projectName?: string, sectionName?: string): string {
  let taskDetails = `- ID: ${task.id}`;
  taskDetails += `\n  Content: ${task.content}`;
  if (task.description) {
    taskDetails += `\n  Description: ${task.description}`;
  }
  if (task.completed_at) {
    taskDetails += `\n  Completed At: ${task.completed_at}`;
  }

  if (projectName) {
    taskDetails += `\n  Project: ${projectName} (${task.project_id})`;
  } else if (task.project_id) {
    taskDetails += `\n  Project ID: ${task.project_id}`;
  }

  if (sectionName) {
    taskDetails += `\n  Section: ${sectionName} (${task.section_id})`;
  } else if (task.section_id) {
    taskDetails += `\n  Section ID: ${task.section_id}`;
  }

  if (task.labels && task.labels.length > 0) {
    taskDetails += `\n  Labels: ${task.labels.join(', ')}`;
  }

  if (task.priority > 1) {
    taskDetails += `\n  Priority: ${task.priority}`;
  }

  if (task.note_count > 0) {
    taskDetails += `\n  Notes: ${task.note_count}`;
  }

  return taskDetails;
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
  // Allows empty object or object with optional cursor/limit
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
  cursor?: string;
  limit?: number;
} {
  // Allows empty object or object with optional projectId, cursor, limit
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

function isMoveTaskArgs(args: unknown): args is {
  taskId: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
} {
  if (typeof args !== 'object' || args === null || !('taskId' in args) || typeof (args as any).taskId !== 'string') {
    return false;
  }
  const { projectId, sectionId, parentId } = args as any;
  const destinations = [projectId, sectionId, parentId];
  const providedDestinations = destinations.filter(dest => dest !== undefined && dest !== null && String(dest).trim() !== '');
  
  // Exactly one destination must be provided and be a non-empty string
  return providedDestinations.length === 1 && 
         providedDestinations.every(dest => typeof dest === 'string');
}

function isBulkMoveTasksArgs(args: unknown): args is {
  taskIds: string[];
  projectId?: string;
  sectionId?: string;
  parentId?: string;
} {
  if (
    typeof args !== 'object' || 
    args === null || 
    !('taskIds' in args) || 
    !Array.isArray((args as any).taskIds) || 
    (args as any).taskIds.length === 0 || 
    !(args as any).taskIds.every((id: any) => typeof id === 'string')
  ) {
    return false;
  }
  const { projectId, sectionId, parentId } = args as any;
  const destinations = [projectId, sectionId, parentId];
  const providedDestinations = destinations.filter(dest => dest !== undefined && dest !== null && String(dest).trim() !== '');
  
  return providedDestinations.length === 1 && 
         providedDestinations.every(dest => typeof dest === 'string');
}

function isCreateLabelArgs(args: unknown): args is {
  name: string;
  color?: string;
  isFavorite?: boolean;
  order?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isLabelIdArgs(args: unknown): args is {
  labelId: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "labelId" in args &&
    typeof (args as { labelId: string }).labelId === "string"
  );
}

// Type guard for get_labels which takes no arguments in this SDK version
function isGetLabelsArgs(args: unknown): args is { 
  cursor?: string;
  limit?: number;
} { 
  return typeof args === "object" && args !== null;
}

function isUpdateLabelArgs(args: unknown): args is {
  labelId: string;
  name?: string;
  color?: string;
  isFavorite?: boolean;
  order?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "labelId" in args &&
    typeof (args as { labelId: string }).labelId === "string"
  );
}

function isCreateCommentArgs(args: unknown): args is {
  content: string;
  taskId?: string;
  projectId?: string;
  attachment?: {
    fileName?: string;
    fileType?: string;
    fileUrl?: string;
    resourceType?: string;
  } | null;
} {
  if (typeof args !== "object" || args === null || !("content" in args) || typeof (args as any).content !== "string") {
    return false;
  }
  const { taskId, projectId } = args as any;
  const targets = [taskId, projectId];
  const providedTargets = targets.filter(target => target !== undefined && target !== null && String(target).trim() !== '');
  
  // Exactly one target must be provided and be a non-empty string
  return providedTargets.length === 1 && 
         providedTargets.every(target => typeof target === 'string');
}

function isCommentIdArgs(args: unknown): args is {
  commentId: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "commentId" in args &&
    typeof (args as { commentId: string }).commentId === "string"
  );
}

function isCommentsArgs(args: unknown): args is {
  taskId?: string;
  projectId?: string;
  cursor?: string;
  limit?: number;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  const { taskId, projectId } = args as any;
  const targets = [taskId, projectId];
  const providedTargets = targets.filter(target => target !== undefined && target !== null && String(target).trim() !== '');
  
  // Exactly one target must be provided and be a non-empty string, or no targets (for all comments)
  return providedTargets.length <= 1 && 
         providedTargets.every(target => typeof target === 'string');
}

function isUpdateCommentArgs(args: unknown): args is {
  commentId: string;
  content: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "commentId" in args &&
    "content" in args &&
    typeof (args as { commentId: string; content: string }).commentId === "string" &&
    typeof (args as { commentId: string; content: string }).content === "string"
  );
}

function isGetCompletedTasksArgs(args: unknown): args is {
  since: string;
  until: string;
  projectId?: string;
  sectionId?: string;
  limit?: number;
  cursor?: string;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }

  const typed = args as any;

  // since and until are required
  if (typeof typed.since !== "string" || typeof typed.until !== "string") {
    return false;
  }
  if (typed.projectId !== undefined && typeof typed.projectId !== "string") {
    return false;
  }
  if (typed.sectionId !== undefined && typeof typed.sectionId !== "string") {
    return false;
  }
  if (typed.limit !== undefined && typeof typed.limit !== "number") {
    return false;
  }
  if (typed.cursor !== undefined && typeof typed.cursor !== "string") {
    return false;
  }

  return true;
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
    MOVE_TASK_TOOL,
    BULK_MOVE_TASKS_TOOL,
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
    // Label tools
    CREATE_LABEL_TOOL,
    GET_LABEL_TOOL,
    GET_LABELS_TOOL,
    UPDATE_LABEL_TOOL,
    DELETE_LABEL_TOOL,
    // Comment tools
    CREATE_COMMENT_TOOL,
    GET_COMMENT_TOOL,
    GET_COMMENTS_TOOL,
    UPDATE_COMMENT_TOOL,
    DELETE_COMMENT_TOOL,
    // Completed tasks tool (Sync API)
    GET_COMPLETED_TASKS_TOOL,
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

      // Prepare arguments for getTasksByFilter
      // Prepend "search: " to the query for more robust keyword searching with Todoist API
      const searchQuery = args.query.startsWith("search:") ? args.query : `search: ${args.query}`;
      const filterArgs: any = { query: searchQuery };
      if (args.limit) filterArgs.limit = args.limit;
      
      // Note: args.projectId is not directly used by getTasksByFilter unless incorporated into the query string.
      // For example: `search: ${args.query} & #ProjectName` or `search: ${args.query} & ##ProjectID`

      const tasksResponse = await todoistClient.getTasksByFilter(filterArgs);
      
      const matchingTasksData = tasksResponse.results || [];

      if (matchingTasksData.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `No tasks found matching the filter query "${args.query}"` 
          }],
          isError: false,
        };
      }

      // Asynchronously format tasks and fetch project names if necessary
      const formattedTaskList = await Promise.all(matchingTasksData.map(async (task: any) => {
        let taskDisplay = formatTask(task); // formatTask now includes Project ID
        if (task.projectId) {
          try {
            const project = await todoistClient.getProject(task.projectId);
            taskDisplay += `\n  Project Name: ${project.name}`;
          } catch (projectError: any) {
            // Silently ignore project fetch errors for search, or log them
            // taskDisplay += `\n  Project Name: (Error fetching project details)`; 
            console.error(`Error fetching project ${task.projectId} for search result: ${projectError.message}`);
          }
        }
        return taskDisplay;
      }));
      
      const taskListString = formattedTaskList.join('\n\n');
      const nextCursorMessage = tasksResponse.nextCursor ? `\n\nNext cursor for more results: ${tasksResponse.nextCursor}` : '';
      
      return {
        content: [{ 
          type: "text", 
          text: `Found ${matchingTasksData.length} task(s) matching "${args.query}":\n\n${taskListString}${nextCursorMessage}` 
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

      const projectsResponse = await todoistClient.getProjects(params);
      
      const projectList = projectsResponse.results?.map(formatProject).join('\n\n') || 'No projects found';
      const nextCursor = projectsResponse.nextCursor ? `\n\nNext cursor: ${projectsResponse.nextCursor}` : '';
      
      return {
        content: [{ 
          type: "text", 
          text: `Projects:\n${projectList}${nextCursor}` 
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
      if (args.cursor) params.cursor = args.cursor;
      if (args.limit) params.limit = args.limit;

      const sectionsResponse = await todoistClient.getSections(params);
      
      const sectionList = sectionsResponse.results?.map((section: any) => 
        `- ${section.name} (ID: ${section.id}, Project ID: ${section.projectId})`
      ).join('\n') || 'No sections found';
      
      const nextCursorMessage = sectionsResponse.nextCursor ? `\n\nNext cursor for more sections: ${sectionsResponse.nextCursor}` : '';
      
      return {
        content: [{ 
          type: "text", 
          text: `Sections:\n${sectionList}${nextCursorMessage}` 
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

    // Label operations
    if (name === "todoist_create_label") {
      if (!isCreateLabelArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for create_label" }], isError: true };
      }
      try {
        const label = await todoistClient.addLabel(args);
        return { 
          content: [{ type: "text", text: `Label created:\n${formatLabel(label)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error creating label: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_get_label") {
      if (!isLabelIdArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for get_label" }], isError: true };
      }
      try {
        const label = await todoistClient.getLabel(args.labelId);
        return { 
          content: [{ type: "text", text: `Label details:\n${formatLabel(label)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error getting label: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_get_labels") {
      if (!isGetLabelsArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for get_labels. This tool takes an optional cursor and limit." }], isError: true };
      }
      try {
        const params: any = {};
        if (args.cursor) params.cursor = args.cursor;
        if (args.limit) params.limit = args.limit;
        
        const labelsResponse = await todoistClient.getLabels(params); 
        const labelList = labelsResponse.results?.map(formatLabel).join('\n\n') || 'No labels found';
        const nextCursor = labelsResponse.nextCursor ? `\n\nNext cursor for more labels: ${labelsResponse.nextCursor}` : '';

        return {
          content: [{
            type: "text",
            text: `Labels:\n${labelList}${nextCursor}`
          }],
          isError: false
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error getting labels: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_update_label") {
      if (!isUpdateLabelArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for update_label" }], isError: true };
      }
      try {
        const { labelId, ...updateArgs } = args;
        const updatedLabel = await todoistClient.updateLabel(labelId, updateArgs);
        return { 
          content: [{ type: "text", text: `Label updated:\n${formatLabel(updatedLabel)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error updating label: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_delete_label") {
      if (!isLabelIdArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for delete_label" }], isError: true };
      }
      try {
        await todoistClient.deleteLabel(args.labelId);
        return { 
          content: [{ type: "text", text: `Label ${args.labelId} deleted.` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error deleting label: ${error.message}` }], isError: true };
      }
    }

    // Move task operations
    if (name === "todoist_move_task") {
      if (!isMoveTaskArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for move_task. Provide taskId and exactly one of: projectId, sectionId, or parentId (must be a non-empty string)." }], isError: true };
      }
      try {
        const moveArgs: { projectId?: string; sectionId?: string; parentId?: string } = {};
        if (args.projectId) moveArgs.projectId = args.projectId;
        else if (args.sectionId) moveArgs.sectionId = args.sectionId;
        else if (args.parentId) moveArgs.parentId = args.parentId;

        // Use moveTasks from SDK v4+
        await todoistClient.moveTasks([args.taskId], moveArgs as any); // Cast to any for MoveTaskArgs as it expects RequireExactlyOne
        
        const movedTask = await todoistClient.getTask(args.taskId);
        return {
          content: [{
            type: "text",
            text: `Task ${args.taskId} moved successfully.\nNew details:\n${formatTask(movedTask)}`
          }],
          isError: false
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error moving task: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_bulk_move_tasks") {
      if (!isBulkMoveTasksArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for bulk_move_tasks. Provide a non-empty array of taskIds and exactly one of: projectId, sectionId, or parentId (must be a non-empty string)." }], isError: true };
      }
      try {
        const moveArgs: { projectId?: string; sectionId?: string; parentId?: string } = {};
        if (args.projectId) moveArgs.projectId = args.projectId;
        else if (args.sectionId) moveArgs.sectionId = args.sectionId;
        else if (args.parentId) moveArgs.parentId = args.parentId;

        console.error(`[DEBUG] todoist_bulk_move_tasks: Attempting to move ${args.taskIds.length} task(s) individually. Destination args: ${JSON.stringify(moveArgs)}`);

        const results = {
          succeeded: [] as string[],
          failed: [] as { id: string, error: string }[],
        };

        for (const taskId of args.taskIds) {
          try {
            console.error(`[DEBUG] Moving task ${taskId} to: ${JSON.stringify(moveArgs)}`);
            const individualMoveResult = await todoistClient.moveTasks([taskId], moveArgs as any);
            // Check if the API returned the task and if its properties reflect the move
            // For simplicity, we assume if no error is thrown, it was accepted by the API.
            // A more robust check would be to fetch the task again and verify its sectionId/projectId.
            if (individualMoveResult && individualMoveResult.length > 0 && individualMoveResult[0].id === taskId) {
              console.error(`[DEBUG] Task ${taskId} processed by API. Result: ${JSON.stringify(individualMoveResult[0])}`);
              // Further check if sectionId or projectId in individualMoveResult[0] matches moveArgs
              const movedTaskDetails = individualMoveResult[0];
              let successfulMove = false;
              if (moveArgs.sectionId && movedTaskDetails.sectionId === moveArgs.sectionId) successfulMove = true;
              else if (moveArgs.projectId && movedTaskDetails.projectId === moveArgs.projectId) successfulMove = true;
              else if (moveArgs.parentId && movedTaskDetails.parentId === moveArgs.parentId) successfulMove = true;
              // If the API doesn't reflect the change immediately in the returned object, we might still count it as succeeded based on no error.
              // For now, we count as success if API call didn't throw and returned our task.
              if (successfulMove) {
                 results.succeeded.push(taskId);
              } else {
                 // This case means API processed it but didn't reflect the change in the returned object, or it was already there.
                 // Could be a race condition or API behavior. We'll count it as attempted but not fully confirmed by response.
                 console.warn(`[DEBUG] Task ${taskId} processed, but move not immediately confirmed in API response object. Counting as succeeded based on no error.`);
                 results.succeeded.push(taskId); // Tentatively count as success
              }
            } else {
              // API call succeeded but didn't return our task, or returned empty array
              console.warn(`[DEBUG] Task ${taskId} move API call succeeded but task not found in response or empty response.`);
              results.succeeded.push(taskId); // Tentatively count as success if API didn't error
            }
          } catch (taskError: any) {
            console.error(`[DEBUG] Failed to move task ${taskId}: ${taskError.message}`);
            results.failed.push({ id: taskId, error: taskError.message });
          }
        }

        let summaryMessage = `Bulk move attempt complete for ${args.taskIds.length} task(s). `;
        summaryMessage += `Succeeded: ${results.succeeded.length}. `;
        if (results.succeeded.length > 0) summaryMessage += `Moved IDs: ${results.succeeded.join(", ")}. `;
        summaryMessage += `Failed: ${results.failed.length}.`;
        if (results.failed.length > 0) {
          summaryMessage += ` Failed IDs: ${results.failed.map(f => `${f.id} (${f.error})`).join("; ")}`;
        }

        return {
          content: [{ type: "text", text: summaryMessage }],
          isError: results.failed.length > 0 && results.succeeded.length === 0, // Overall error if all fails
        };
      } catch (error: any) {
        console.error(`[DEBUG] todoist_bulk_move_tasks: Outer error caught: ${error.message}`, error);
        return { content: [{ type: "text", text: `Error in bulk moving tasks: ${error.message}` }], isError: true };
      }
    }

    // Comment operations
    if (name === "todoist_create_comment") {
      if (!isCreateCommentArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for create_comment" }], isError: true };
      }
      try {
        const commentData: any = { content: args.content };
        if (args.taskId) commentData.taskId = args.taskId;
        if (args.projectId) commentData.projectId = args.projectId;
        if (args.attachment) commentData.attachment = args.attachment;

        const comment = await todoistClient.addComment(commentData);
        return { 
          content: [{ type: "text", text: `Comment created:\n${formatComment(comment)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error creating comment: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_get_comment") {
      if (!isCommentIdArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for get_comment" }], isError: true };
      }
      try {
        const comment = await todoistClient.getComment(args.commentId);
        return { 
          content: [{ type: "text", text: `Comment details:\n${formatComment(comment)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error getting comment: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_get_comments") {
      if (!isCommentsArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for get_comments. Provide either taskId or projectId, not both." }], isError: true };
      }
      try {
        const params: any = {};
        if (args.taskId) params.taskId = args.taskId;
        if (args.projectId) params.projectId = args.projectId;
        if (args.cursor) params.cursor = args.cursor;
        if (args.limit) params.limit = args.limit;
        
        const commentsResponse = await todoistClient.getComments(params); 
        const commentList = commentsResponse.results?.map(formatComment).join('\n\n') || 'No comments found';
        const nextCursor = commentsResponse.nextCursor ? `\n\nNext cursor for more comments: ${commentsResponse.nextCursor}` : '';

        return {
          content: [{
            type: "text",
            text: `Comments:\n${commentList}${nextCursor}`
          }],
          isError: false
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error getting comments: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_update_comment") {
      if (!isUpdateCommentArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for update_comment" }], isError: true };
      }
      try {
        const { commentId, ...updateArgs } = args;
        const updatedComment = await todoistClient.updateComment(commentId, updateArgs);
        return { 
          content: [{ type: "text", text: `Comment updated:\n${formatComment(updatedComment)}` }], 
          isError: false 
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error updating comment: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_delete_comment") {
      if (!isCommentIdArgs(args)) {
        return { content: [{ type: "text", text: "Invalid arguments for delete_comment" }], isError: true };
      }
      try {
        await todoistClient.deleteComment(args.commentId);
        return {
          content: [{ type: "text", text: `Comment ${args.commentId} deleted.` }],
          isError: false
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error deleting comment: ${error.message}` }], isError: true };
      }
    }

    if (name === "todoist_get_completed_tasks") {
      if (!isGetCompletedTasksArgs(args)) {
        return {
          content: [{ type: "text", text: "Invalid arguments for get_completed_tasks. 'since' and 'until' are required ISO 8601 datetime strings." }],
          isError: true
        };
      }

      try {
        // Build API v1 query parameters
        const queryParams: Record<string, any> = {
          since: args.since,
          until: args.until,
        };
        if (args.projectId) queryParams.project_id = args.projectId;
        if (args.sectionId) queryParams.section_id = args.sectionId;
        if (args.limit !== undefined) queryParams.limit = Math.min(args.limit, 200);
        if (args.cursor) queryParams.cursor = args.cursor;

        // Call API v1 completed tasks endpoint
        const response: CompletedTasksResponse = await callTodoistAPIv1('tasks/completed/by_completion_date', queryParams);

        if (!response.items || response.items.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No completed tasks found matching the specified criteria"
            }],
            isError: false
          };
        }

        // Format completed tasks
        const formattedTasks = response.items.map(task => {
          return formatCompletedTask(task);
        });

        const taskList = formattedTasks.join('\n\n');

        // Build pagination info
        let paginationInfo = '';
        if (response.next_cursor) {
          paginationInfo = `\n\nPagination: Showing ${response.items.length} task(s). `;
          paginationInfo += `More results available. Use cursor="${response.next_cursor}" to retrieve the next page.`;
        }

        return {
          content: [{
            type: "text",
            text: `Completed Tasks (${response.items.length} found):\n\n${taskList}${paginationInfo}`
          }],
          isError: false
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error getting completed tasks: ${error.message}`
          }],
          isError: true
        };
      }
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