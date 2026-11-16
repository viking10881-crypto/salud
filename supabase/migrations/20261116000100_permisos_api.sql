-- =====================================================================
-- Salud+ · Permisos de la Data API
-- 1) En proyectos nuevos las tablas pueden no exponerse automáticamente a
--    la API: se otorgan permisos explícitos SOLO a usuarios autenticados.
--    (Las filas siguen protegidas por RLS: cada quien ve solo lo suyo.)
-- 2) Las funciones creadas en public son ejecutables por todos por defecto;
--    handle_new_user es SECURITY DEFINER, así que se revoca ese permiso.
-- =====================================================================

-- Nadie sin sesión (anon) puede tocar los datos médicos
revoke all on public.perfiles, public.citas, public.medicamentos, public.tomas, public.examenes from anon;

-- Usuarios con sesión
grant select, update                 on public.perfiles     to authenticated;
grant select, insert, update, delete on public.citas        to authenticated;
grant select, insert, update, delete on public.medicamentos to authenticated;
grant select, insert, update, delete on public.tomas        to authenticated;
grant select, insert, update, delete on public.examenes     to authenticated;

-- Funciones internas: solo las usan los triggers
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
