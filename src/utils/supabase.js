import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://apnsmyxiedfazfyclccu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbnNteXhpZWRmYXpmeWNsY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzA2MzMsImV4cCI6MjA4OTQ0NjYzM30.YDs6H8rq5twW5Hue3nIsDPHZqbt8xUdyKdRG3apV_Mc'

export const supabase = createClient(supabaseUrl, supabaseKey)
