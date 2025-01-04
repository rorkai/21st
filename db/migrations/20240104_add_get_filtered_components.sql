-- Create the get_filtered_components function
CREATE OR REPLACE FUNCTION public.get_filtered_components(
  p_quick_filter text,
  p_sort_by text,
  p_offset integer,
  p_limit integer
) RETURNS TABLE (
  id bigint,
  component_names jsonb,
  description text,
  code text,
  demo_code text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id text,
  dependencies jsonb,
  is_public boolean,
  downloads_count integer,
  likes_count integer,
  component_slug text,
  name text,
  demo_dependencies jsonb,
  registry text,
  direct_registry_dependencies jsonb,
  demo_direct_registry_dependencies jsonb,
  preview_url text,
  video_url text,
  license text,
  user_data jsonb,
  total_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Calculate total count based on filter
  WITH filtered_components AS (
    SELECT c.*
    FROM components c
    WHERE c.is_public = true
    AND CASE 
      WHEN p_quick_filter = 'last_released' THEN
        c.created_at > NOW() - INTERVAL '7 days'
      WHEN p_quick_filter = 'most_downloaded' THEN
        c.downloads_count > 6
      ELSE true
    END
  )
  SELECT COUNT(*) INTO v_total_count FROM filtered_components;

  RETURN QUERY
  WITH filtered_components AS (
    SELECT 
      c.*,
      row_to_json(u.*)::jsonb as user_data
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE c.is_public = true
    AND CASE 
      WHEN p_quick_filter = 'last_released' THEN
        c.created_at > NOW() - INTERVAL '7 days'
      WHEN p_quick_filter = 'most_downloaded' THEN
        c.downloads_count > 6
      ELSE true
    END
  )
  SELECT 
    c.id,
    c.component_names,
    c.description,
    c.code,
    c.demo_code,
    c.created_at,
    c.updated_at,
    c.user_id,
    c.dependencies,
    c.is_public,
    c.downloads_count,
    c.likes_count,
    c.component_slug,
    c.name,
    c.demo_dependencies,
    c.registry,
    c.direct_registry_dependencies,
    c.demo_direct_registry_dependencies,
    c.preview_url,
    c.video_url,
    c.license,
    c.user_data,
    v_total_count as total_count
  FROM filtered_components c
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'downloads' THEN c.downloads_count
      WHEN p_sort_by = 'likes' THEN c.likes_count
      WHEN p_sort_by = 'date' THEN extract(epoch from c.created_at)
    END DESC NULLS LAST
  OFFSET p_offset
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_filtered_components(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_components(text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_filtered_components(text, text, integer, integer) TO service_role;

-- Notify PostgREST about the new function
NOTIFY pgrst, 'reload schema'; 

-- Create the get_components_counts function
CREATE OR REPLACE FUNCTION public.get_components_counts(
) RETURNS TABLE (
  filter_type text,
  count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 'all'::text as filter_type, COUNT(*)::bigint
  FROM components c
  WHERE c.is_public = true
  UNION ALL
  SELECT 'last_released'::text, COUNT(*)::bigint
  FROM components c
  WHERE c.is_public = true
  AND c.created_at > NOW() - INTERVAL '7 days'
  UNION ALL
  SELECT 'most_downloaded'::text, COUNT(*)::bigint
  FROM components c
  WHERE c.is_public = true
  AND c.downloads_count > 6;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_components_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_components_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_components_counts() TO service_role;

-- Notify PostgREST about the new function
NOTIFY pgrst, 'reload schema'; 