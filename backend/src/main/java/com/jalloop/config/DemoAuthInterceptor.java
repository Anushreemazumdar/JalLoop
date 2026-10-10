package com.jalloop.config;

import com.jalloop.entity.Actor;
import com.jalloop.enums.ActorRole;
import com.jalloop.exception.ApiException;
import com.jalloop.repository.ActorRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class DemoAuthInterceptor implements HandlerInterceptor {
    public static final String ACTOR_ATTR = "jalloop.actor";
    private final ActorRepository actorRepository;

    public DemoAuthInterceptor(ActorRepository actorRepository) {
        this.actorRepository = actorRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path.endsWith("/api/v1/health") || path.endsWith("/api/v1/meta")) {
            return true;
        }
        String rawKey = request.getHeader("X-Actor-Key");
        final String key = (rawKey == null || rawKey.isBlank()) ? "demo-citizen" : rawKey;
        Actor actor = actorRepository.findByActorKey(key)
                .orElseThrow(() -> ApiException.badRequest("Unknown demo actor key: " + key));
        request.setAttribute(ACTOR_ATTR, actor);
        return true;
    }

    public static Actor requireAdmin(HttpServletRequest request) {
        Actor actor = current(request);
        if (actor.getRole() != ActorRole.ADMIN) {
            throw ApiException.forbidden("This action requires the demo administrator role");
        }
        return actor;
    }

    public static Actor requireStaff(HttpServletRequest request) {
        Actor actor = current(request);
        if (actor.getRole() != ActorRole.ADMIN && actor.getRole() != ActorRole.INSPECTOR) {
            throw ApiException.forbidden("This action requires inspector or administrator demo role");
        }
        return actor;
    }

    public static Actor current(HttpServletRequest request) {
        Object attr = request.getAttribute(ACTOR_ATTR);
        if (!(attr instanceof Actor actor)) {
            throw ApiException.badRequest("Demo actor is not available");
        }
        return actor;
    }
}
