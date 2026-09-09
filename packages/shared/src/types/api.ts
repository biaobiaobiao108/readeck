export interface CreateBookmarkDTO {
  url: string;
  title?: string;
  tags?: string[];
  labels?: string[];
  html?: string;
  is_starred?: boolean;
  is_archived?: boolean;
}

export interface UpdateBookmarkDTO {
  title?: string;
  description?: string;
  is_archived?: boolean;
  is_starred?: boolean;
  tags?: string[];
  labels?: string[];
}

export interface BookmarkListQuery {
  status?: 'all' | 'unread' | 'archive' | 'favorite';
  tag?: string;
  labels?: string;
  url?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
