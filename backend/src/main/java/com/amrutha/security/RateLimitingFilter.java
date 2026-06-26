package com.amrutha.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter implements Filter {

    private final ConcurrentHashMap<String, RequestCounter> ipRequestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 30;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        
        // Rate limit public submit routes
        if (path.startsWith("/api/public/orders") || 
            path.startsWith("/api/public/callbacks") || 
            path.startsWith("/api/public/bulk-orders") ||
            path.startsWith("/api/public/upload-screenshot")) {

            String ip = getClientIP(httpRequest);
            long currentTime = System.currentTimeMillis();

            RequestCounter counter = ipRequestCounts.compute(ip, (key, value) -> {
                if (value == null || (currentTime - value.startTime > 60000)) {
                    return new RequestCounter(currentTime, 1);
                } else {
                    value.count.incrementAndGet();
                    return value;
                }
            });

            if (counter.count.get() > MAX_REQUESTS_PER_MINUTE) {
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\": \"Too Many Requests\", \"message\": \"Rate limit exceeded. Please try again in a minute.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class RequestCounter {
        final long startTime;
        final AtomicInteger count;

        RequestCounter(long startTime, int initialCount) {
            this.startTime = startTime;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
