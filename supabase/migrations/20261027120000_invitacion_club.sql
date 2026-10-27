-- Invitación de un club a una cuenta que ya existía (JSON en la ficha del usuario).
alter table public.usuarios add column if not exists invitacion_club text;
comment on column public.usuarios.invitacion_club is 'Invitacion club (fldInvitaClubQ9)';
