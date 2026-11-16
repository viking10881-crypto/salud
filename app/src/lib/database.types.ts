// Tipos del esquema de supabase/migrations/20261116000000_esquema_inicial.sql
// Se pueden regenerar con: npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

type Timestamps = { created_at: string; updated_at: string };

export type Perfil = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  tipo_sangre: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
  alergias: string | null;
  avatar_url: string | null;
} & Timestamps;

export type Cita = {
  id: string;
  user_id: string;
  fecha: string;
  especialidad: string;
  tipo: 'general' | 'odontologia' | 'especialista';
  doctor: string | null;
  lugar: string | null;
  notas: string | null;
  recordatorio_minutos: number | null;
  completada: boolean;
} & Timestamps;

export type Medicamento = {
  id: string;
  user_id: string;
  nombre: string;
  dosis: string;
  cantidad: string | null;
  horarios: string[];
  dias_semana: number[] | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  notas: string | null;
  activo: boolean;
} & Timestamps;

export type Toma = {
  id: string;
  user_id: string;
  medicamento_id: string;
  programada_para: string;
  tomada_en: string | null;
  omitida: boolean;
  created_at: string;
};

export type Examen = {
  id: string;
  user_id: string;
  titulo: string;
  categoria: 'laboratorio' | 'radiografia' | 'ecografia' | 'formula' | 'diagnostico' | 'otro';
  fecha: string;
  archivo_path: string | null;
  mime_type: string | null;
  notas: string | null;
} & Timestamps;

type Tabla<Row, RequiredInsert extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsert>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      perfiles: Tabla<Perfil, 'id'>;
      citas: Tabla<Cita, 'fecha' | 'especialidad'>;
      medicamentos: Tabla<Medicamento, 'nombre' | 'dosis'>;
      tomas: Tabla<Toma, 'medicamento_id' | 'programada_para'>;
      examenes: Tabla<Examen, 'titulo'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
