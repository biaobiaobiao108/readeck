export type BookmarkType = 'article' | 'photo' | 'video';

export interface Tag {
  id: number;
  name: string;
  count?: number;
}

export interface Bookmark {
  id: number;
  uid: string;
  user_id: number;
  url: string;
  title: string;
  description: string;
  author: string;
  site_name: string;
  type: BookmarkType;
  is_archived: boolean;
  is_starred: boolean;
  reading_time: number; // in seconds or minutes
  word_count: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface BookmarkContent {
  id: number;
  bookmark_id: number;
  html: string;
  text: string;
}

export interface BookmarkDetail extends Bookmark {
  content?: BookmarkContent;
}

export interface ExtractedArticle {
  title: string;
  description: string;
  author: string;
  site_name: string;
  url: string;
  html: string;
  text: string;
  thumbnail_url?: string;
  reading_time: number;
  word_count: number;
}
