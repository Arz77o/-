/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// 1. نقوم بتعريف القيم الثابتة لمتجرك لضمان عملها دائماً على خوادم Cloudflare[cite: 2]
const PROD_SUPABASE_URL = 'https://wkayzovjcryopwgyboww.supabase.co';//[cite: 2]
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXl6b3ZqY3J5b3B3Z3lib3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5ODA4NjUsImV4cCI6MjA5OTU1Njg2NX0.hW6wtN4i8bQWVcaZG3YKwHjmoz8_FJFbadN9FQy7QJo'; //[cite: 2] ضع مفتاحك الحقيقي هنا

// 2. نحاول القراءة من متغيرات البيئة أولاً، وإذا لم تكن متوفرة نستخدم القيم الثابتة المباشرة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn('Missing Supabase credentials in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);