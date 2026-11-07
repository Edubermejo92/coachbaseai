-- Una sola fila de suscripción por email.
--
-- Stripe manda checkout.session.completed y customer.subscription.created a
-- la vez. Los dos webhooks buscaban la fila, no la encontraban y la creaban,
-- así que cada alta nueva quedaba duplicada. Al cancelar solo se actualizaba
-- una de las dos y la otra seguía en «Activa», con lo que el usuario
-- conservaba PRO sin pagar.
--
-- Con el índice, el segundo INSERT falla y stripe.mts vuelve a buscar la
-- fila y la actualiza (ver guardarSuscripcion).

-- 1) Se queda la fila más antigua de cada email; las demás se borran. El
--    trigger suscripciones_enlaces limpia el enlace inverso en usuarios.
delete from public.suscripciones s
using public.suscripciones o
where lower(s.email) = lower(o.email)
  and s._orden > o._orden;

-- 2) Que no vuelva a pasar.
create unique index if not exists suscripciones_email_unico
  on public.suscripciones (lower(email))
  where email is not null;
