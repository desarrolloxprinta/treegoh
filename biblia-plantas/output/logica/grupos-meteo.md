# Grupos de las reglas meteorológicas

Las reglas de `reglas-meteo.json` se dirigen a grupos funcionales (`afecta_a.categorias`) que no coinciden con la `categoria` de las fichas. La Fase 5 fija esta correspondencia, generada por `scripts/compilar.py` e incluida en `biblia.json` como `grupos_meteo` de cada especie. Es una regla de ingeniería del producto, no un dato botánico: se apoya en la temperatura mínima verificada de cada ficha (`min_c`). Un grupo de frío aplicado de más solo adelanta un aviso de protección (opción conservadora).

| Grupo | Criterio | Especies |
|---|---|---|
| `suculentas_cactus` | categoría suculenta o cactus | 25 |
| `palmeras` | categoría palmera | 6 |
| `orquideas_epifitas` | categoría orquídea | 7 |
| `calatheas_helechos` | categoría helecho o familia Marantaceae | 17 |
| `ficus` | género Ficus | 6 |
| `tropicales_araceas` | familia Araceae, o cualquier ficha no suculenta con temperatura mínima ≥ 10 °C | 125 |
| `plantas_flor` | categoría flor | 16 |
| `balcon_exterior` | no depende de la especie: lo activa la ubicación declarada por el usuario (balcón, terraza, alféizar exterior) | según ubicación |

Fichas sin grupo propio (solo reciben las reglas `todas`, y las de balcón si están fuera): 17: *Allium schoenoprasum*, *Aspidistra elatior*, *Citrus limon*, *Coriandrum sativum*, *Cycas revoluta*, *Dionaea muscipula*, *Fatsia japonica*, *Hedera helix*, *Jasminum polyanthum*, *Mentha spicata*, *Origanum vulgare*, *Petroselinum crispum*, *Pinguicula moranensis*, *Salvia rosmarinus*, *Sarracenia purpurea*, *Thymus vulgaris*, *Ulmus parvifolia*.

| Especie | Categoría | Mín. °C | Grupos |
|---|---|---|---|
| *Adenium obesum* | suculenta | 15 | suculentas_cactus |
| *Adiantum raddianum* | helecho | 10 | calatheas_helechos, tropicales_araceas |
| *Aechmea fasciata* | flor | 15.5 | tropicales_araceas, plantas_flor |
| *Aeonium arboreum* | suculenta | 5 | suculentas_cactus |
| *Aeschynanthus radicans* | trepadora | 16 | tropicales_araceas |
| *Aglaonema commutatum* | tropical | 15 | tropicales_araceas |
| *Allium schoenoprasum* | aromatica | 7 | — |
| *Alocasia amazonica* | tropical | 15 | tropicales_araceas |
| *Alocasia baginda* | tropical | 15 | tropicales_araceas |
| *Alocasia cuprea* | tropical | 18 | tropicales_araceas |
| *Alocasia macrorrhizos* | tropical | 15 | tropicales_araceas |
| *Alocasia micholitziana* | tropical | 15 | tropicales_araceas |
| *Alocasia reginula* | tropical | 15 | tropicales_araceas |
| *Alocasia zebrina* | tropical | 15 | tropicales_araceas |
| *Aloe vera* | suculenta | 10 | suculentas_cactus |
| *Amydrium medium* | trepadora | 15 | tropicales_araceas |
| *Anthurium andraeanum* | flor | 15 | tropicales_araceas, plantas_flor |
| *Anthurium clarinervium* | tropical | 15 | tropicales_araceas |
| *Anthurium crystallinum* | tropical | 15 | tropicales_araceas |
| *Anthurium veitchii* | tropical | 15 | tropicales_araceas |
| *Araucaria heterophylla* | otra | 10 | tropicales_araceas |
| *Asparagus setaceus* | helecho | 13 | calatheas_helechos, tropicales_araceas |
| *Aspidistra elatior* | tropical | 7 | — |
| *Asplenium nidus* | helecho | 13 | calatheas_helechos, tropicales_araceas |
| *Astrophytum asterias* | cactus | 7 | suculentas_cactus |
| *Beaucarnea recurvata* | suculenta | 10 | suculentas_cactus |
| *Begonia elatior* | flor | 13 | tropicales_araceas, plantas_flor |
| *Begonia maculata* | tropical | 13 | tropicales_araceas |
| *Begonia rex* | tropical | 15 | tropicales_araceas |
| *Capsicum annuum* | aromatica | 13 | tropicales_araceas |
| *Carmona microphylla* | bonsai | 13 | tropicales_araceas |
| *Cattleya hybrida* | orquidea | 13 | orquideas_epifitas, tropicales_araceas |
| *Cereus repandus* | cactus | 7 | suculentas_cactus |
| *Ceropegia woodii* | trepadora | 15.6 | tropicales_araceas |
| *Chamaedorea elegans* | palmera | 15 | palmeras, tropicales_araceas |
| *Chamaedorea seifrizii* | palmera | 15.5 | palmeras, tropicales_araceas |
| *Chlorophytum comosum* | tropical | 10 | tropicales_araceas |
| *Cissus rhombifolia* | trepadora | 18 | tropicales_araceas |
| *Citrus limon* | aromatica | 5 | — |
| *Citrus microcarpa* | aromatica | 13 | tropicales_araceas |
| *Clivia miniata* | flor | 5 | plantas_flor |
| *Codiaeum variegatum* | tropical | 15 | tropicales_araceas |
| *Coffea arabica* | tropical | 15 | tropicales_araceas |
| *Cordyline fruticosa* | tropical | 15 | tropicales_araceas |
| *Coriandrum sativum* | aromatica | 7 | — |
| *Crassula ovata* | suculenta | 5 | suculentas_cactus |
| *Ctenanthe burle-marxii* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Curio rowleyanus* | suculenta | 10 | suculentas_cactus |
| *Cycas revoluta* | otra | -5 | — |
| *Cyclamen persicum* | flor | 10 | tropicales_araceas, plantas_flor |
| *Cymbidium hybridum* | orquidea | 10 | orquideas_epifitas, tropicales_araceas |
| *Davallia fejeensis* | helecho | 13 | calatheas_helechos, tropicales_araceas |
| *Dendrobium nobile* | orquidea | 10 | orquideas_epifitas, tropicales_araceas |
| *Dieffenbachia seguine* | tropical | 15 | tropicales_araceas |
| *Dionaea muscipula* | carnivora | 2 | — |
| *Dracaena angolensis* | suculenta | 13 | suculentas_cactus |
| *Dracaena fragrans* | tropical | 16 | tropicales_araceas |
| *Dracaena marginata* | tropical | 16 | tropicales_araceas |
| *Dracaena masoniana* | suculenta | 13 | suculentas_cactus |
| *Dracaena reflexa* | tropical | 16 | tropicales_araceas |
| *Dracaena sanderiana* | tropical | 18 | tropicales_araceas |
| *Dracaena trifasciata* | suculenta | 10 | suculentas_cactus |
| *Drosera capensis* | carnivora | 10 | tropicales_araceas |
| *Dypsis lutescens* | palmera | 15 | palmeras, tropicales_araceas |
| *Echeveria elegans* | suculenta | 5 | suculentas_cactus |
| *Echinocactus grusonii* | cactus | 7 | suculentas_cactus |
| *Epipremnum aureum* | trepadora | 15 | tropicales_araceas |
| *Epipremnum pinnatum* | trepadora | 15 | tropicales_araceas |
| *Euphorbia milii* | suculenta | 15 | suculentas_cactus |
| *Euphorbia pulcherrima* | flor | 10 | tropicales_araceas, plantas_flor |
| *Euphorbia trigona* | suculenta | 12 | suculentas_cactus |
| *Fatsia japonica* | tropical | -5 | — |
| *Ficus benghalensis* | tropical | 15 | ficus, tropicales_araceas |
| *Ficus benjamina* | tropical | 15 | ficus, tropicales_araceas |
| *Ficus elastica* | tropical | 15 | ficus, tropicales_araceas |
| *Ficus lyrata* | tropical | 13 | ficus, tropicales_araceas |
| *Ficus microcarpa* | bonsai | 15 | ficus, tropicales_araceas |
| *Ficus pumila* | trepadora | 5 | ficus |
| *Fittonia albivenis* | tropical | 15 | tropicales_araceas |
| *Gardenia jasminoides* | flor | 10 | tropicales_araceas, plantas_flor |
| *Gerbera jamesonii* | flor | 7 | plantas_flor |
| *Goeppertia lancifolia* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Goeppertia makoyana* | tropical | 15 | calatheas_helechos, tropicales_araceas |
| *Goeppertia orbifolia* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Goeppertia roseopicta* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Goeppertia warszewiczii* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Goeppertia zebrina* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Guzmania lingulata* | flor | 10 | tropicales_araceas, plantas_flor |
| *Gymnocalycium mihanovichii* | cactus | 10 | suculentas_cactus |
| *Haworthiopsis attenuata* | suculenta | 10 | suculentas_cactus |
| *Hedera helix* | trepadora | 7 | — |
| *Hibiscus rosa-sinensis* | flor | 15 | tropicales_araceas, plantas_flor |
| *Hippeastrum hybridum* | flor | 7 | plantas_flor |
| *Howea forsteriana* | palmera | 10 | palmeras, tropicales_araceas |
| *Hoya australis* | trepadora | 15 | tropicales_araceas |
| *Hoya carnosa* | trepadora | 13 | tropicales_araceas |
| *Hoya kerrii* | trepadora | 13 | tropicales_araceas |
| *Hoya linearis* | trepadora | 15 | tropicales_araceas |
| *Hoya pubicalyx* | trepadora | 13 | tropicales_araceas |
| *Hypoestes phyllostachya* | tropical | 15 | tropicales_araceas |
| *Jasminum polyanthum* | trepadora | 5 | — |
| *Kalanchoe blossfeldiana* | suculenta | 7 | suculentas_cactus |
| *Kalanchoe tomentosa* | suculenta | 15 | suculentas_cactus |
| *Lithops lesliei* | suculenta | 5 | suculentas_cactus |
| *Mammillaria elongata* | cactus | 7 | suculentas_cactus |
| *Maranta leuconeura* | tropical | 15 | calatheas_helechos, tropicales_araceas |
| *Mentha spicata* | aromatica | — | — |
| *Monstera adansonii* | trepadora | 10 | tropicales_araceas |
| *Monstera deliciosa* | tropical | 10 | tropicales_araceas |
| *Monstera dubia* | trepadora | 15.6 | tropicales_araceas |
| *Monstera obliqua* | trepadora | 15 | tropicales_araceas |
| *Musa acuminata* | tropical | 16 | tropicales_araceas |
| *Nepenthes alata* | carnivora | 15 | tropicales_araceas |
| *Nephrolepis exaltata* | helecho | 10 | calatheas_helechos, tropicales_araceas |
| *Ocimum basilicum* | aromatica | 10 | tropicales_araceas |
| *Oncidium hybridum* | orquidea | 13 | orquideas_epifitas, tropicales_araceas |
| *Opuntia microdasys* | cactus | 7 | suculentas_cactus |
| *Origanum vulgare* | aromatica | -5 | — |
| *Oxalis triangularis* | otra | 12 | tropicales_araceas |
| *Pachira aquatica* | tropical | 15 | tropicales_araceas |
| *Paphiopedilum hybridum* | orquidea | 18 | orquideas_epifitas, tropicales_araceas |
| *Peperomia caperata* | tropical | 15 | tropicales_araceas |
| *Peperomia obtusifolia* | tropical | 15 | tropicales_araceas |
| *Peperomia prostrata* | trepadora | 15 | tropicales_araceas |
| *Petroselinum crispum* | aromatica | 7 | — |
| *Phalaenopsis hybrida* | orquidea | 15 | orquideas_epifitas, tropicales_araceas |
| *Philodendron erubescens* | trepadora | 15 | tropicales_araceas |
| *Philodendron gloriosum* | tropical | 15 | tropicales_araceas |
| *Philodendron hederaceum* | trepadora | 15 | tropicales_araceas |
| *Philodendron melanochrysum* | trepadora | 15 | tropicales_araceas |
| *Philodendron verrucosum* | trepadora | 15 | tropicales_araceas |
| *Phlebodium aureum* | helecho | 16 | calatheas_helechos, tropicales_araceas |
| *Phoenix roebelenii* | palmera | 13 | palmeras, tropicales_araceas |
| *Pilea cadierei* | tropical | 13 | tropicales_araceas |
| *Pilea peperomioides* | tropical | 13 | tropicales_araceas |
| *Pinguicula moranensis* | carnivora | 5 | — |
| *Platycerium bifurcatum* | helecho | 13 | calatheas_helechos, tropicales_araceas |
| *Plectranthus scutellarioides* | tropical | 13 | tropicales_araceas |
| *Polyscias fruticosa* | bonsai | 16 | tropicales_araceas |
| *Portulacaria afra* | bonsai | 15 | tropicales_araceas |
| *Pteris cretica* | helecho | 12 | calatheas_helechos, tropicales_araceas |
| *Radermachera sinica* | tropical | 15 | tropicales_araceas |
| *Rhaphidophora tetrasperma* | trepadora | 18 | tropicales_araceas |
| *Rhapis excelsa* | palmera | 13 | palmeras, tropicales_araceas |
| *Rhipsalis baccifera* | cactus | 15 | suculentas_cactus |
| *Rhododendron simsii* | flor | 5 | plantas_flor |
| *Salvia rosmarinus* | aromatica | -5 | — |
| *Sarracenia purpurea* | carnivora | -5 | — |
| *Schefflera arboricola* | tropical | 15 | tropicales_araceas |
| *Schlumbergera truncata* | cactus | 13 | suculentas_cactus |
| *Scindapsus pictus* | trepadora | 15.6 | tropicales_araceas |
| *Scindapsus treubii* | trepadora | 15.6 | tropicales_araceas |
| *Sedum morganianum* | suculenta | 10 | suculentas_cactus |
| *Serissa foetida* | bonsai | 10 | tropicales_araceas |
| *Soleirolia soleirolii* | tropical | 10 | tropicales_araceas |
| *Spathiphyllum wallisii* | tropical | 15 | tropicales_araceas |
| *Stephanotis floribunda* | trepadora | 13 | tropicales_araceas |
| *Strelitzia nicolai* | tropical | 12 | tropicales_araceas |
| *Strelitzia reginae* | flor | 13 | tropicales_araceas, plantas_flor |
| *Streptocarpus ionanthus* | flor | 16 | tropicales_araceas, plantas_flor |
| *Stromanthe thalia* | tropical | 16 | calatheas_helechos, tropicales_araceas |
| *Syngonium podophyllum* | trepadora | 15 | tropicales_araceas |
| *Thaumatophyllum bipinnatifidum* | tropical | 15.5 | tropicales_araceas |
| *Thymus vulgaris* | aromatica | -5 | — |
| *Tillandsia ionantha* | otra | 13 | tropicales_araceas |
| *Tradescantia spathacea* | tropical | 15 | tropicales_araceas |
| *Tradescantia zebrina* | trepadora | 10 | tropicales_araceas |
| *Ulmus parvifolia* | bonsai | -5 | — |
| *Vanda hybrida* | orquidea | 13 | orquideas_epifitas, tropicales_araceas |
| *Vriesea splendens* | flor | 15 | tropicales_araceas, plantas_flor |
| *Yucca gigantea* | tropical | 10 | tropicales_araceas |
| *Zamioculcas zamiifolia* | tropical | 15 | tropicales_araceas |
| *Zantedeschia aethiopica* | flor | 0 | plantas_flor |
