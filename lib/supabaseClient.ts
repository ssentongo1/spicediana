import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjfamthotsmghdisbrxp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZmFtdGhvdHNtZ2hkaXNicnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTkyMjgsImV4cCI6MjA4ODM3NTIyOH0.EhxzwHsK0HdE5iuFDJ_Bye988KzFMY9ZxajNZD2-Pkk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)