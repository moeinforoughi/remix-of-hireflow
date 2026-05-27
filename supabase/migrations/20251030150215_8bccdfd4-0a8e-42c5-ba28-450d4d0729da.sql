-- Enable full replica identity for applications table to ensure complete row data in realtime updates
ALTER TABLE public.applications REPLICA IDENTITY FULL;