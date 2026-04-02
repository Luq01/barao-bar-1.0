package com.musicqueue.repository;

import com.musicqueue.model.YoutubeCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface YoutubeCacheRepository extends JpaRepository<YoutubeCache, String> {
    // O Spring Data JPA cuidará de todas as operações básicas (findById, save, etc.)
}