revoke execute on function public.estimate_service_price(text,text,text,text[]) from public, anon, authenticated;
revoke execute on function public.estimate_service_price(text,text[]) from public, anon, authenticated;
revoke execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.estimate_service_price(text,text,text,text[]) to service_role;
grant execute on function public.estimate_service_price(text,text[]) to service_role;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text) to service_role;
