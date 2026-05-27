-- Enable realtime for applications table
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- Enable realtime for candidates table  
ALTER TABLE public.candidates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;