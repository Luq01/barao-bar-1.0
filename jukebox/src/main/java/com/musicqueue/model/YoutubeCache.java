package com.musicqueue.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor; // Resolve o erro: Expected no arguments but found 3
import lombok.Data;          // Resolve os erros: Cannot resolve method 'get...'
import lombok.NoArgsConstructor;

@Entity
@Table(name = "youtube_cache")
@Data // Gera automaticamente Getters, Setters, toString, equals e hashCode
@AllArgsConstructor // Cria o construtor com os 3 campos (termo, videoId, titulo)
@NoArgsConstructor  // Cria o construtor vazio exigido pelo Hibernate
public class YoutubeCache {

    @Id
    @Column(name = "termo_busca", length = 255)
    private String termoBusca;

    @Column(name = "video_id", length = 50)
    private String videoId;

    @Column(name = "titulo", length = 500)
    private String titulo;
}