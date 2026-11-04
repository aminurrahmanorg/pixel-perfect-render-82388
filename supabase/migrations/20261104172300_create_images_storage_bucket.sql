INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', false, 5242880)
ON CONFLICT (id) DO NOTHING;
