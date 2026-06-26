package com.amrutha.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI amruthaChickenOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Amrutha Chicken Center API")
                        .description("Production-grade backend API documentation for Amrutha Chicken Center platform.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Amrutha Chicken Center")
                                .email("owner@amruthachicken.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", createAPIKeyScheme()));
    }

    private SecurityScheme createAPIKeyScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer")
                .description("Enter your JWT token in the format: Bearer <token>");
    }
}
