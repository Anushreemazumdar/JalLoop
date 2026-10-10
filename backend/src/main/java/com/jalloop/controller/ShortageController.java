package com.jalloop.controller;

import com.jalloop.config.DemoAuthInterceptor;
import com.jalloop.dto.ShortageDtos;
import com.jalloop.enums.Severity;
import com.jalloop.service.ShortageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/water-shortages")
public class ShortageController {
    private final ShortageService shortageService;

    public ShortageController(ShortageService shortageService) {
        this.shortageService = shortageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShortageDtos.ShortageView create(
            @Valid @RequestBody ShortageDtos.CreateShortageRequest request,
            HttpServletRequest http
    ) {
        return shortageService.create(request, DemoAuthInterceptor.current(http));
    }

    @GetMapping
    public List<ShortageDtos.ShortageView> list(@RequestParam(required = false) Severity severity) {
        return shortageService.list(severity);
    }
}
