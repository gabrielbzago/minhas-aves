-- Apollo 0.5.47: padroniza o nome científico do papa-capim
-- Corrige registros já existentes sem duplicar espécies.
update public.species
set scientific_name = 'Sporophila nigricollis',
    genus = 'Sporophila',
    family = coalesce(nullif(family, ''), 'Thraupidae'),
    order_name = coalesce(nullif(order_name, ''), 'Passeriformes')
where lower(trim(common_name)) in ('papa-capim', 'papa capim', 'papa-capim-de-coleira')
   or lower(trim(scientific_name)) in ('sporophila nigricollis', 'oryzoborus nigricollis');
