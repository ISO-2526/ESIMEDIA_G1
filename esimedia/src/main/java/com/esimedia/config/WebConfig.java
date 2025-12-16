package com.esimedia.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configuración para servir archivos de audio desde la carpeta static/audio
        registry.addResourceHandler("/audio/**")
                .addResourceLocations("classpath:/static/audio/");
        
        // Configuración para servir imágenes de portada desde la carpeta static/cover
        registry.addResourceHandler("/cover/**")
                .addResourceLocations("classpath:/static/cover/");
        
        // Configuración para servir imágenes de perfil desde la carpeta static/pfp
        registry.addResourceHandler("/pfp/**")
                .addResourceLocations("classpath:/static/pfp/");
    }
}
