import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bossApi } from '../api/modules/boss.api';
export function useBoss() {
  const queryClient = useQueryClient();
  const {
    data: status,
    isLoading,
    error
  } = useQuery({
    queryKey: ['boss', 'status'],
    queryFn: bossApi.getStatus,
    // The weekend countdown needs to keep ticking in the background even
    // while inactive, and flip over to "active" automatically once the
    // weekend spawn happens — refetch periodically instead of only on
    // navigation.
    refetchInterval: 60_000
  });
  const boss = status?.active ? status.boss : undefined;
  const nextSpawnAt = status && !status.active ? status.nextSpawnAt : undefined;
  const damageMutation = useMutation({
    mutationFn: ({
      bossId,
      exerciseType,
      amount,
      weaponId
    }) => bossApi.damage(bossId, exerciseType, amount, weaponId),
    onSuccess: updatedBoss => {
      queryClient.setQueryData(['boss', 'status'], {
        active: true,
        boss: updatedBoss
      });
    }
  });
  return {
    boss,
    nextSpawnAt,
    isLoading,
    error,
    damageBoss: damageMutation.mutateAsync,
    isAttacking: damageMutation.isPending
  };
}