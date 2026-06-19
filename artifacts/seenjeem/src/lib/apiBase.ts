// API base URL - يستخدم متغير البيئة في الإنتاج، وفي التطوير يشير للـ backend المحلي
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:10000";
