export interface Task {
  id: number;
  creator_id: number;
  assignee_id: number | null;
  title: string;
  description: string;
  status: 'todo' | 'in progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}
