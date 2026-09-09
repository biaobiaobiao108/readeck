import type {
  ApiResponse,
  AuthResponse,
  Bookmark,
  BookmarkContent,
  BookmarkDetail,
  BookmarkListQuery,
  CreateBookmarkDTO,
  PaginatedResponse,
  Tag,
  UpdateBookmarkDTO,
  User,
} from '@readeck/shared';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('readeck_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('readeck_token', token);
    } else {
      localStorage.removeItem('readeck_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const json = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !json.success) {
      throw new Error(json.error || `HTTP error ${response.status}`);
    }

    return json.data as T;
  }

  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Bookmarks
  async getBookmarks(params: BookmarkListQuery = {}): Promise<PaginatedResponse<Bookmark>> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.tag) query.set('tag', params.tag);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return this.request<PaginatedResponse<Bookmark>>(`/bookmarks?${query.toString()}`);
  }

  async createBookmark(dto: CreateBookmarkDTO): Promise<BookmarkDetail> {
    return this.request<BookmarkDetail>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getBookmark(id: number): Promise<BookmarkDetail> {
    return this.request<BookmarkDetail>(`/bookmarks/${id}`);
  }

  async getBookmarkContent(id: number): Promise<BookmarkContent> {
    return this.request<BookmarkContent>(`/bookmarks/${id}/content`);
  }

  async updateBookmark(id: number, dto: UpdateBookmarkDTO): Promise<BookmarkDetail> {
    return this.request<BookmarkDetail>(`/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteBookmark(id: number): Promise<void> {
    await this.request(`/bookmarks/${id}`, { method: 'DELETE' });
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags');
  }
}

export const api = new ApiClient();
