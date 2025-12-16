package grupo1.esimedia.accounts.service;

import grupo1.esimedia.accounts.model.ContentCreator;
import grupo1.esimedia.accounts.repository.ContentCreatorRepository;
import grupo1.esimedia.content.model.Content;
import grupo1.esimedia.content.repository.CreatorContentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContentCreatorService {

    @Autowired
    private ContentCreatorRepository contentCreatorRepository;

    @Autowired
    private CreatorContentRepository contentRepository;

    public Optional<ContentCreator> findByEmail(String email) {
        return contentCreatorRepository.findByEmail(email);
    }

    public Optional<ContentCreator> findByAlias(String alias) {
        return contentCreatorRepository.findByAlias(alias);
    }

    public List<Content> getContentsByCreator(String alias) {
        return contentRepository.findByCreatorAlias(alias);
    }

    public ContentCreator updateProfile(String email, String newName, String newSurname, String newAlias, String newDescription, String newPicture) {
        Optional<ContentCreator> optionalCreator = contentCreatorRepository.findByEmail(email);
        if (optionalCreator.isEmpty()) {
            throw new RuntimeException("Creador de contenido no encontrado");
        }
        ContentCreator creator = optionalCreator.get();

        if (newName != null) {
            creator.setName(newName);
        }
        if (newSurname != null) {
            creator.setSurname(newSurname);
        }
        if (newAlias != null) {
            creator.setAlias(newAlias);
        }
        if (newDescription != null) {
            creator.setDescription(newDescription);
        }
        if (newPicture != null) {
            creator.setPicture(newPicture);
        }

        return contentCreatorRepository.save(creator);
    }
}
