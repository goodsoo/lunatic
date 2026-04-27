-- /me profile editor: atomic update across members + member_genres.
-- Members table has column-level UPDATE grants for self-edit (0002_rls.sql), so
-- direct UPDATE works for single fields, but replacing the genre set requires
-- DELETE + INSERT atomically — that's what this RPC is for. Keeps the form
-- one round-trip and avoids partial-write states (e.g. genres deleted but
-- insert failed).

create or replace function update_my_profile(
  p_dancer_name text,
  p_type member_type,
  p_genres genre[],
  p_primary_genre genre,
  p_instagram_handle text default null,
  p_bio text default null,
  p_bio_long text default null,
  p_video_urls text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_genre genre;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from members where id = v_uid) then
    raise exception 'no_member_row';
  end if;

  if p_dancer_name is null or length(trim(p_dancer_name)) = 0 then
    raise exception 'dancer_name_required';
  end if;

  if array_length(p_genres, 1) is null or array_length(p_genres, 1) < 1 then
    raise exception 'genres_required';
  end if;

  if not (p_primary_genre = any(p_genres)) then
    raise exception 'primary_genre_not_in_list';
  end if;

  if array_length(p_video_urls, 1) > 3 then
    raise exception 'too_many_videos';
  end if;

  if p_bio_long is not null and length(p_bio_long) > 200 then
    raise exception 'bio_long_too_long';
  end if;

  begin
    update members set
      dancer_name = trim(p_dancer_name),
      type = p_type,
      instagram_handle = nullif(trim(coalesce(p_instagram_handle, '')), ''),
      bio = nullif(trim(coalesce(p_bio, '')), ''),
      bio_long = nullif(trim(coalesce(p_bio_long, '')), ''),
      video_urls = coalesce(p_video_urls, '{}'::text[])
    where id = v_uid;
  exception
    when unique_violation then
      raise exception 'dancer_name_taken';
  end;

  delete from member_genres where member_id = v_uid;
  foreach v_genre in array p_genres loop
    insert into member_genres (member_id, genre, is_primary)
    values (v_uid, v_genre, v_genre = p_primary_genre)
    on conflict (member_id, genre) do nothing;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function update_my_profile(
  text, member_type, genre[], genre, text, text, text, text[]
) from public, anon;
grant execute on function update_my_profile(
  text, member_type, genre[], genre, text, text, text, text[]
) to authenticated;
