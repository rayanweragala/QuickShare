package com.quickshare.backend.util;

import com.quickshare.backend.model.room.AnimalData;
import com.quickshare.backend.model.room.AnimalIdentity;

import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.Set;

public class AnimalNameGenerator {
    private static final List<String> ADJECTIVES = Arrays.asList(
            "Brave", "Clever", "Swift", "Mighty", "Noble", "Gentle", "Wise", "Bold",
            "Fierce", "Jolly", "Lucky", "Happy", "Sneaky", "Playful", "Cheerful",
            "Curious", "Daring", "Eager", "Friendly", "Graceful", "Honest", "Kind",
            "Lively", "Merry", "Peaceful", "Quick", "Relaxed", "Silent", "Trusty",
            "Vibrant", "Witty", "Zealous", "Agile", "Bouncy", "Calm", "Dazzling"
    );

    private static final List<AnimalData> ANIMALS = Arrays.asList(
            new AnimalData("Penguin", "🐧", "#FF6B6B"),
            new AnimalData("Tiger", "🐯", "#FF8E53"),
            new AnimalData("Panda", "🐼", "#4ECDC4"),
            new AnimalData("Dolphin", "🐬", "#45B7D1"),
            new AnimalData("Fox", "🦊", "#FFA07A"),
            new AnimalData("Lion", "🦁", "#FFD93D"),
            new AnimalData("Elephant", "🐘", "#95E1D3"),
            new AnimalData("Koala", "🐨", "#F38181"),
            new AnimalData("Owl", "🦉", "#AA96DA"),
            new AnimalData("Eagle", "🦅", "#FCBAD3"),
            new AnimalData("Wolf", "🐺", "#A8E6CF"),
            new AnimalData("Bear", "🐻", "#FFD3B6"),
            new AnimalData("Rabbit", "🐰", "#FFAAA5"),
            new AnimalData("Deer", "🦌", "#FF8B94"),
            new AnimalData("Monkey", "🐵", "#FFC5BF"),
            new AnimalData("Cat", "🐱", "#BAE1FF"),
            new AnimalData("Dog", "🐶", "#FFB7B2"),
            new AnimalData("Hamster", "🐹", "#FFDAC1"),
            new AnimalData("Unicorn", "🦄", "#E2F0CB"),
            new AnimalData("Dragon", "🐉", "#B5EAD7"),
            new AnimalData("Turtle", "🐢", "#C7CEEA"),
            new AnimalData("Frog", "🐸", "#98DDCA"),
            new AnimalData("Bee", "🐝", "#FFE6A7"),
            new AnimalData("Butterfly", "🦋", "#D5AAFF"),
            new AnimalData("Octopus", "🐙", "#85E3FF"),
            new AnimalData("Whale", "🐋", "#6BCB77"),
            new AnimalData("Shark", "🦈", "#4D96FF"),
            new AnimalData("Flamingo", "🦩", "#FF6B9D"),
            new AnimalData("Peacock", "🦚", "#00DFA2"),
            new AnimalData("Sloth", "🦥", "#F6C6EA")
    );

    private static final Random random = new Random();

    public static AnimalIdentity generateRandomAnimal() {
        String adjective = ADJECTIVES.get(random.nextInt(ADJECTIVES.size()));
        AnimalData animal = ANIMALS.get(random.nextInt(ANIMALS.size()));

        String name = adjective + " " + animal.getName();

        return new AnimalIdentity(name, animal.getIcon(), animal.getColor());
    }

    public static AnimalIdentity generateUniqueAnimal(Set<String> existingNames) {
        AnimalIdentity identity;
        int attempts = 0;
        int maxAttempts = 100;

        do {
            identity = generateRandomAnimal();
            attempts++;
        } while (existingNames.contains(identity.getName()) && attempts < maxAttempts);

        if (existingNames.contains(identity.getName())) {
            identity.setName(identity.getName() + " " + random.nextInt(1000));
        }

        return identity;
    }
}
