-- Minhas Aves — Expansão do catálogo de espécies
-- Compatível com instalações já existentes.
-- Execute no Supabase SQL Editor apenas uma vez.

insert into public.species(common_name, scientific_name, family, order_name, genus, origin)
values
('Tico-tico','Zonotrichia capensis','Passerellidae','Passeriformes','Zonotrichia','América do Sul'),
('Tico-tico-rei','Coryphospingus cucullatus','Thraupidae','Passeriformes','Coryphospingus','América do Sul'),
('Sabiá-laranjeira','Turdus rufiventris','Turdidae','Passeriformes','Turdus','América do Sul'),
('Sabiá-do-campo','Mimus saturninus','Mimidae','Passeriformes','Mimus','América do Sul'),
('Bigodinho','Sporophila lineola','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Caboclinho','Sporophila bouvreuil','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Pássaro-preto','Gnorimopsar chopi','Icteridae','Passeriformes','Gnorimopsar','América do Sul'),
('Coleiro Laranjeira','Sporophila caerulescens hellmayri','Thraupidae','Passeriformes','Sporophila','América do Sul')
on conflict (scientific_name) do update set
  common_name=excluded.common_name,
  family=excluded.family,
  order_name=excluded.order_name,
  genus=excluded.genus,
  origin=excluded.origin,
  is_active=true;
