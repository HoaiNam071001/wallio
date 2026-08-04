"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { useAuth } from "@/lib/hooks/use-auth";
import { getProfile, upsertProfile } from "@/lib/queries/profile";
import type { ProfileUpdate } from "@/lib/types/database.types";

export function useProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(supabase, user!.id),
    enabled: !!user,
  });
}

export function useUpsertProfile() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: Omit<ProfileUpdate, "id">) => upsertProfile(supabase, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
