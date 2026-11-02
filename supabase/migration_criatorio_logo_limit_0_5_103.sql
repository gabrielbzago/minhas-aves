-- Apollo 0.5.103: amplia o limite do bucket de logos dos criatórios.
-- Execute uma única vez no SQL Editor do Supabase antes de publicar esta versão.
update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'criatorio-brand';
