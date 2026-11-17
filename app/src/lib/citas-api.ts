import type { Cita, Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type CitaInput = Omit<Database['public']['Tables']['citas']['Insert'], 'id' | 'user_id'>;

export async function listarCitas(): Promise<Cita[]> {
  const { data, error } = await supabase.from('citas').select('*').order('fecha');
  if (error) throw error;
  return data;
}

export async function crearCita(input: CitaInput) {
  const { data, error } = await supabase.from('citas').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarCita(id: string, cambios: Partial<CitaInput>) {
  const { data, error } = await supabase.from('citas').update(cambios).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function eliminarCita(id: string) {
  const { error } = await supabase.from('citas').delete().eq('id', id);
  if (error) throw error;
}
