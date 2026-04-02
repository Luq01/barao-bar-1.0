package com.musicqueue.service;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.musicqueue.dto.YoutubeSearchResult;
import com.musicqueue.model.YoutubeCache;
import com.musicqueue.repository.YoutubeCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class YoutubeService {

    @Value("${youtube.api.key}")
    private String apiKey;

    private final YoutubeCacheRepository cacheRepository;

    public YoutubeSearchResult buscarVideoId(String busca) {
        return buscarVideoCompleto(busca);
    }

    public YoutubeSearchResult buscarVideoCompleto(String busca) {
        if (busca == null || busca.trim().isEmpty()) return null;

        String termo = busca.toLowerCase().trim();

        var cache = cacheRepository.findById(termo);
        if (cache.isPresent()) {
            log.info("💾 Cache encontrado para: '{}'", termo);
            return new YoutubeSearchResult(cache.get().getVideoId(), cache.get().getTitulo());
        }

        log.info("🌐 Buscando na API do YouTube: '{}'", termo);
        var resultado = chamarApiYoutube(termo);

        if (resultado != null) {
            try {
                cacheRepository.save(new YoutubeCache(termo, resultado.getId(), resultado.getTitulo()));
            } catch (Exception e) {
                log.warn("⚠️ Não foi possível salvar o cache para: {}", termo);
            }
        }

        return resultado;
    }

    private YoutubeSearchResult chamarApiYoutube(String busca) {
        try {
            YouTube youtube = new YouTube.Builder(
                    new NetHttpTransport(),
                    new GsonFactory(),
                    request -> {})
                    .setApplicationName("music-queue")
                    .build();

            var search = youtube.search().list(Collections.singletonList("id,snippet"));
            search.setKey(apiKey);


            search.setQ(busca);

            search.setType(Collections.singletonList("video"));
            search.setMaxResults(1L);

            // GARANTIA: Filtra apenas vídeos que permitem reprodução externa
            search.setVideoEmbeddable("true");

            var response = search.execute();

            if (response.getItems() != null && !response.getItems().isEmpty()) {
                var item = response.getItems().get(0);
                return new YoutubeSearchResult(
                        item.getId().getVideoId(),
                        item.getSnippet().getTitle()
                );
            }
        } catch (Exception e) {
            log.error("❌ Erro na API do YouTube: {}", e.getMessage());
        }
        return null;
    }
}