import { q } from "../quiz";
import type { TriviaQ } from "../types";

export const NATURE_BANK: TriviaQ[] = [
  q("A group of lions is called a…", ["Herd", "Pride", "Pack", "Flock"], "Pride", 1, "A pride is the usual social group of African lions."),
  q("A tadpole grows into a…", ["Snake", "Frog", "Fish", "Bird"], "Frog", 1),
  q("Bees make honey from…", ["Pollen only", "Nectar", "Tree sap", "Dew"], "Nectar", 1, "Forager bees collect nectar; enzymes and evaporation turn it into honey."),
  q("The largest ocean on Earth is the…", ["Atlantic", "Indian", "Pacific", "Arctic"], "Pacific", 1),
  q("Deciduous trees drop their leaves in…", ["Spring", "Autumn", "High summer", "Every full moon"], "Autumn", 1),
  q("The Sahara Desert is on which continent?", ["Asia", "Australia", "Africa", "South America"], "Africa", 1),
  q("An animal that eats only plants is a…", ["Carnivore", "Herbivore", "Omnivore", "Detritivore"], "Herbivore", 1),
  q("An animal that eats both plants and animals is an…", ["Herbivore", "Carnivore", "Omnivore", "Insectivore"], "Omnivore", 1),
  q("The Amazon River empties into the…", ["Pacific Ocean", "Atlantic Ocean", "Mediterranean", "Indian Ocean"], "Atlantic Ocean", 1),
  q("Which of these is a mammal?", ["Shark", "Bat", "Crocodile", "Penguin"], "Bat", 1, "Bats are the only mammals that truly fly."),
  q("A cactus stores water in its…", ["Flowers", "Stem", "Seeds only", "Thorns"], "Stem", 1),
  q("The world's largest tropical rainforest is the…", ["Congo", "Amazon", "Daintree", "Borneo"], "Amazon", 1),
  q("What do you call a young deer?", ["Cub", "Fawn", "Calf", "Kid"], "Fawn", 1),
  q("Coral reefs are built mainly by…", ["Kelp", "Coral polyps", "Oysters", "Sponges only"], "Coral polyps", 1),
  q("The pigment that makes most leaves green is…", ["Melanin", "Chlorophyll", "Carotene only", "Hemoglobin"], "Chlorophyll", 1),

  q("Monarch butterflies spend the winter in…", ["Canada", "Mexico", "Iceland", "Japan"], "Mexico", 2, "Eastern North American monarchs overwinter in oyamel fir forests of central Mexico."),
  q("The tallest living tree species is the…", ["Giant sequoia", "Coast redwood", "Douglas fir", "Eucalyptus"], "Coast redwood", 2, "Coast redwoods (Sequoia sempervirens) hold the height record; giant sequoias are the most massive."),
  q("Photosynthesis in plant cells happens in the…", ["Mitochondria", "Chloroplasts", "Nucleus", "Vacuole"], "Chloroplasts", 2),
  q("The only continent with no native reptiles is…", ["Europe", "Antarctica", "Australia", "South America"], "Antarctica", 2),
  q("Baobab trees are most closely associated with…", ["The tundra", "Africa", "The Alps", "Patagonia"], "Africa", 2, "African baobabs define dry savanna; related species live in Madagascar and Australia."),
  q("A biome of grasses with few trees, often with grazing herds, is a…", ["Taiga", "Savanna", "Mangrove", "Tundra"], "Savanna", 2),
  q("Salmon that return from the sea to spawn in fresh water are…", ["Anadromous", "Catadromous", "Sessile", "Pelagic only"], "Anadromous", 2),
  q("The Great Barrier Reef lies off…", ["South Africa", "Australia", "Brazil", "India"], "Australia", 2),
  q("Fungi get their food mainly by…", ["Photosynthesis", "Absorbing decayed matter", "Hunting insects only", "Drinking nectar"], "Absorbing decayed matter", 2),
  q("Which bird is flightless?", ["Albatross", "Penguin", "Swallow", "Hawk"], "Penguin", 2),

  q("Who formalized binomial nomenclature for living things?", ["Darwin", "Linnaeus", "Mendel", "Wallace"], "Linnaeus", 3, "Carl Linnaeus published Systema Naturae; the 10th edition (1758) is the zoological starting point."),
  q("The axolotl is native to…", ["The Amazon", "Lakes of Mexico", "The Nile", "Tasmania"], "Lakes of Mexico", 3, "Wild axolotls survive in remnant canals of Xochimilco, in the Valley of Mexico."),
  q("How many living elephant species are generally recognized?", ["One", "Two", "Three", "Five"], "Three", 3, "African savanna, African forest, and Asian elephants are the three living species."),
  q("Sharks and rays have skeletons made mostly of…", ["Bone", "Cartilage", "Chitin", "Keratin"], "Cartilage", 3, "They are cartilaginous fishes (Chondrichthyes)."),
  q("A keystone species is one that…", ["Is always the largest", "Has an outsized effect on its ecosystem", "Never migrates", "Lives only in captivity"], "Has an outsized effect on its ecosystem", 3),
  q("The taiga is also called the…", ["Tropical rainforest", "Boreal forest", "Chaparral", "Salt marsh"], "Boreal forest", 3),
];
