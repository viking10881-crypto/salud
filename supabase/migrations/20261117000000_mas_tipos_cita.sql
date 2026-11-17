-- =====================================================================
-- Salud+ · Más tipos de cita médica
-- Reemplaza la restricción de 3 tipos por la lista completa.
-- Mantener sincronizado con app/src/lib/tipos-cita.ts
-- =====================================================================

alter table public.citas drop constraint if exists citas_tipo_check;

alter table public.citas add constraint citas_tipo_check check (tipo in (
  'general', 'especialista', 'control', 'odontologia', 'laboratorio', 'imagenes',
  'terapia', 'psicologia', 'oftalmologia', 'ginecologia', 'pediatria', 'nutricion',
  'vacunacion', 'urgencias', 'otro'
));
