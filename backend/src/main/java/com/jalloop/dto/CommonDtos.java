package com.jalloop.dto;

import com.jalloop.entity.Actor;
import com.jalloop.enums.ActorRole;

import java.util.UUID;

public final class CommonDtos {
    private CommonDtos() {}

    public record ActorView(UUID id, String actorKey, String displayName, ActorRole role, boolean syntheticDemo) {
        public static ActorView from(Actor actor) {
            return new ActorView(actor.getId(), actor.getActorKey(), actor.getDisplayName(), actor.getRole(), actor.isSyntheticDemo());
        }
    }

    public record PageMeta(int page, int size, long totalElements, int totalPages) {}
}
