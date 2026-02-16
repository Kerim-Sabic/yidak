alter table public.worker_profiles
  add column if not exists total_reviews integer not null default 0;

alter table public.reviews
  add column if not exists cleanliness_rating integer not null default 5;

update public.reviews
   set cleanliness_rating = coalesce(cleanliness_rating, rating, 5)
 where cleanliness_rating is null;

create or replace function public.update_worker_rating()
returns trigger
language plpgsql
as $$
begin
  update public.worker_profiles
     set average_rating = coalesce(
           (
             select round(avg(rating)::numeric, 2)::double precision
               from public.reviews
              where reviewee_id = new.reviewee_id
           ),
           0
         ),
         total_reviews = coalesce(
           (
             select count(*)
               from public.reviews
              where reviewee_id = new.reviewee_id
           ),
           0
         ),
         updated_at = now()
   where user_id = new.reviewee_id;

  return new;
end;
$$;

drop trigger if exists after_review_insert on public.reviews;
create trigger after_review_insert
  after insert on public.reviews
  for each row execute function public.update_worker_rating();
