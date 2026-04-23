package com.bot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class BotConfig {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Bean
    public RestTemplate getTemplate() {
        RestTemplate template = new RestTemplate();

        template.getInterceptors().add(((request, body, execution) -> {
            request.getHeaders().add("Authorization", "Bearer " + apiKey);
            request.getHeaders().add("HTTP-Referer", "http://localhost:8080"); // Required by OpenRouter
            request.getHeaders().add("Content-Type", "application/json");
            return execution.execute(request, body);
        }));

        return template;
    }
}
